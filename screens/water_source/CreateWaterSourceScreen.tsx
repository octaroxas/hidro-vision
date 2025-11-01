import { FormWaterSource, WaterClass, WaterSource, WaterSourceType } from "@/@types/types";
import api from "@/api/Axios";
import ButtonP from "@/components/form/Button";
import Input from "@/components/form/Input";
import { useTheme } from "@/hooks/useTheme";
import { router } from "@/router/Router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from '@react-native-picker/picker';
import { isAxiosError } from "axios";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/next';
import { Upload } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, {
    LatLng,
    MapPressEvent,
    Marker,
    MarkerDragStartEndEvent,
    Polygon,
    PROVIDER_GOOGLE,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const INITIAL_REGION = {
    latitude: -2.430070,
    longitude: -54.715307,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const schema = z.object({
    name: z.string({ required_error: 'O nome do manancial é obrigatório!' }).nonempty(),
    description: z.string().optional().nullable(),
    water_source_type_id: z.number({ required_error: 'O tipo de manancial é obrigatório!' }),
    water_class_id: z.number({ required_error: 'A classe é obrigatória!' }),
    created_by: z.number(),
});

export default function CreateWaterSourceScreen() {
    const [loading, setLoading] = useState(false);
    const { control, handleSubmit, formState: { errors } } = useForm<FormWaterSource>({
        resolver: zodResolver(schema),
        defaultValues: { water_source_type_id: undefined, created_by: 1, water_class_id: undefined, description: null },
    });

    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const [waterSourceTypes, setWaterSourceTypes] = useState<WaterSourceType[]>([]);
    const [waterClasses, setWaterClasses] = useState<WaterClass[]>([]);
    const [mapCoordinates, setMapCoordinates] = useState<LatLng[]>([]);
    const [waterSources, setWaterSources] = useState<WaterSource[]>();

    const sanitazeCoord = useCallback((coord: number) => {
        let [num, dig] = coord.toString().split('.');
        dig = dig?.slice(0, 8) || "0";
        return parseFloat(num + '.' + dig);
    }, []);

    useEffect(() => {
        async function getWaterSources() {
            try {
                const [typesRes, classesRes, sourcesRes] = await Promise.all([
                    api.get<{ data: WaterSourceType[] }>('/water-sources-types'),
                    api.get<{ data: WaterClass[] }>('/water-classes'),
                    api.get<{ data: WaterSource[] }>('/water-sources'),
                ]);
                const sources = sourcesRes.data.data.map((item: WaterSource) => ({
                    ...item,
                    coordinates: item.coordinates.map((c: LatLng) => ({
                        latitude: Number(c.latitude),
                        longitude: Number(c.longitude),
                    })),
                }));
                setWaterSources(sources);
                setWaterSourceTypes(typesRes.data.data);
                setWaterClasses(classesRes.data.data);
            } catch (error) {
                console.error('Erro ao buscar os dados:', error);
            }
        }
        getWaterSources();
    }, []);

    const onMapPress = (event: MapPressEvent) => {
        const { coordinate } = event.nativeEvent;
        setMapCoordinates((prev) => [...prev, coordinate]);
    };

    const onDragEnd = (event: MarkerDragStartEndEvent, index: number) => {
        const { coordinate } = event.nativeEvent;
        setMapCoordinates((prev) => {
            const updated = [...prev];
            updated[index] = coordinate;
            return updated;
        });
    };

    // === 📂 Importar CSV de coordenadas ===
    const handleImportCSV = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: true,
            });

            if (res.canceled || !res.assets?.length) return;

            const fileUri = res.assets[0].uri;
            const content = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });


            // Converte CSV para coordenadas
            const lines = content.split(/\r?\n/).filter(Boolean);
            const parsedCoords: LatLng[] = lines.map((line, index) => {
                const [lat, lng] = line.split(',').map((n) => parseFloat(n.trim()));
                if (isNaN(lat) || isNaN(lng)) throw new Error(`Erro na linha ${index + 1}`);
                return { latitude: lat, longitude: lng };
            });

            if (parsedCoords.length < 3) {
                Alert.alert('Atenção', 'O arquivo precisa conter pelo menos 3 coordenadas válidas.');
                return;
            }

            setMapCoordinates(parsedCoords);
            Alert.alert('Sucesso', `${parsedCoords.length} coordenadas importadas!`);
        } catch (err: any) {
            console.error('Erro ao importar CSV:', err);
            Alert.alert('Erro', 'Não foi possível importar o arquivo. Verifique o formato CSV.');
        }
    };

    const onSubmit = async (data: FormWaterSource) => {
        if (mapCoordinates.length < 3) {
            Alert.alert('Atenção', 'Marque no mínimo 3 pontos no mapa para delimitar o manancial!');
            return;
        }

        const payload = {
            ...data,
            coordinates: mapCoordinates.map((coord) => ({
                latitude: sanitazeCoord(coord.latitude),
                longitude: sanitazeCoord(coord.longitude),
            })),
        };

        setLoading(true);
        try {
            const res = await api.post('/water-sources/store', payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            Alert.alert('Sucesso', `${res.data.data.name} cadastrado!`);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
            if (isAxiosError(error) && error.response) {
                Alert.alert('Erro', error.response.data.message);
            } else {
                Alert.alert('Erro', 'Não foi possível cadastrar o manancial.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={t('#2F80ED', '#60A5FA')} />
                <Text style={{ color: t('#111827', '#F9FAFB'), marginTop: 10 }}>Cadastrando manancial...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Cabeçalho */}
                    <View style={styles.header}>
                        <Text style={[styles.appTitle, { color: t('#1F2937', '#F9FAFB') }]}>Cadastrar Manancial</Text>
                        <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>
                            Informe os dados e marque a área no mapa
                        </Text>
                    </View>


                    {/* Inputs */}
                    <Input control={control} name="name" label="Nome do manancial" placeholder="Ex: Igarapé do Tapajós" error={errors?.name?.message} />
                    <Input control={control} name="description" label="Descrição" placeholder="Breve descrição" error={errors?.description?.message} />

                    {/* Picker tipo */}
                    <Controller
                        control={control}
                        name="water_source_type_id"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>Tipo de manancial</Text>
                                <View
                                    style={[
                                        styles.pickerWrapper,
                                        { backgroundColor: t('#F9FAFB', '#111827'), borderColor: t('#D1D5DB', '#374151') },
                                        errors.water_source_type_id && styles.inputError,
                                    ]}
                                >
                                    <Picker
                                        selectedValue={value}
                                        style={[styles.picker, { color: t('#1F2937', '#F9FAFB') }]}
                                        dropdownIconColor={t('#1F2937', '#F9FAFB')}
                                        onValueChange={(val) => onChange(Number(val))}
                                    >
                                        <Picker.Item label="Selecione" value={null} />
                                        {waterSourceTypes.map((item) => (
                                            <Picker.Item key={item.id} label={item.name} value={item.id} />
                                        ))}
                                    </Picker>
                                </View>
                                {errors.water_source_type_id && <Text style={styles.errorText}>{errors.water_source_type_id.message}</Text>}
                            </View>
                        )}
                    />

                    {/* Picker classe */}
                    <Controller
                        control={control}
                        name="water_class_id"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>Classe hídrica</Text>
                                <View
                                    style={[
                                        styles.pickerWrapper,
                                        { backgroundColor: t('#F9FAFB', '#111827'), borderColor: t('#D1D5DB', '#374151') },
                                        errors.water_class_id && styles.inputError,
                                    ]}
                                >
                                    <Picker
                                        selectedValue={value}
                                        style={[styles.picker, { color: t('#1F2937', '#F9FAFB') }]}
                                        dropdownIconColor={t('#1F2937', '#F9FAFB')}
                                        onValueChange={(val) => onChange(Number(val))}
                                    >
                                        <Picker.Item label="Selecione" value={null} />
                                        {waterClasses.map((item) => (
                                            <Picker.Item key={item.id} label={item.water_class} value={item.id} />
                                        ))}
                                    </Picker>
                                </View>
                                {errors.water_class_id && <Text style={styles.errorText}>{errors.water_class_id.message}</Text>}
                            </View>
                        )}
                    />

                    {/* BOTÃO IMPORTAR CSV */}
                    <TouchableOpacity onPress={handleImportCSV} style={[styles.importButton, { backgroundColor: t('#E0F2FE', '#1E3A8A20') }]}>
                        <Upload size={18} color={t('#0369A1', '#60A5FA')} />
                        <Text style={[styles.importText, { color: t('#0369A1', '#93C5FD') }]}>Importar CSV de coordenadas</Text>
                    </TouchableOpacity>
                    {/* Mapa */}
                    <Text style={[styles.label, { color: t('#1F2937', '#F9FAFB') }]}>Delimitação no mapa</Text>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={INITIAL_REGION}
                        onPress={onMapPress}
                        zoomEnabled
                        zoomTapEnabled
                    >
                        {waterSources?.map((marker) => (
                            <Polygon
                                key={marker.id}
                                coordinates={marker.coordinates}
                                strokeColor="#2563EB"
                                fillColor="rgba(37, 99, 235, 0.3)"
                                strokeWidth={2}
                            />
                        ))}
                        {mapCoordinates.map((marker, index) => (
                            <Marker
                                key={index}
                                coordinate={marker}
                                title={`Ponto ${index + 1}`}
                                draggable
                                onDragEnd={(e) => onDragEnd(e, index)}
                            />
                        ))}
                        {mapCoordinates.length >= 3 && (
                            <Polygon
                                coordinates={mapCoordinates}
                                strokeColor="#2F80ED"
                                fillColor="rgba(37, 99, 235, 0.3)"
                                strokeWidth={2}
                            />
                        )}
                    </MapView>

                    {/* Botões */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading}
                            style={[styles.createButton, { backgroundColor: t('#2F80ED', '#2563EB') }]}
                            activeOpacity={0.9}
                        >
                            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.createButtonText}>Cadastrar</Text>}
                        </TouchableOpacity>
                        <ButtonP title="Salvar rascunho" variant="outline" style={{ width: '30%' }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6 },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    pickerWrapper: {
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
        height: 52,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    picker: { width: '100%', height: 50 },
    inputGroup: { marginBottom: 16 },
    inputError: { borderColor: '#f87171', backgroundColor: '#ffe4e6' },
    errorText: { color: '#b91c1c', marginTop: 4, fontSize: 12 },
    map: {
        width: '100%',
        height: Dimensions.get('window').height * 0.35,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 8,
    },
    createButton: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#2F80ED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        width: '65%',
    },
    createButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    themeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 8,
        borderRadius: 8,
        zIndex: 100,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },


    // 

    importButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, marginTop: 4 },
    importText: { fontSize: 14, fontWeight: '600' },

});
