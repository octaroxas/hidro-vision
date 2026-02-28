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
import { StatusBar } from "expo-status-bar";
import { Droplets, MapPin, Trash2, Upload } from "lucide-react-native";
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

    const { theme } = useTheme();
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

    // Função auxiliar para UX: Limpar pontos do mapa
    const handleClearMap = () => {
        setMapCoordinates([]);
    };

    const handleImportCSV = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: true,
            });

            if (res.canceled || !res.assets?.length) return;

            const fileUri = res.assets.uri;
            const content = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });

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
            <View style={[styles.center, { backgroundColor: t('#F9FAFB', '#111827') }]}>
                <ActivityIndicator size="large" color={t('#2F80ED', '#60A5FA')} />
                <Text style={{ color: t('#6B7280', '#9CA3AF'), marginTop: 12, fontWeight: '500' }}>
                    Processando cadastro...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]} edges={['top']}>
            <StatusBar style={isDark ? "light" : "dark"} backgroundColor={t('#F9FAFB', '#111827')} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Cabeçalho Refinado */}
                    <View style={styles.header}>
                        <View style={[styles.iconCircle, { backgroundColor: t('#E0E7FF', 'rgba(96,165,250,0.15)') }]}>
                            <Droplets size={32} color={t('#2F80ED', '#60A5FA')} />
                        </View>
                        <Text style={[styles.appTitle, { color: t('#111827', '#F9FAFB') }]}>Novo Manancial</Text>
                        <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>
                            Preencha os dados e delimite a área no mapa
                        </Text>
                    </View>

                    {/* CARD 1: INFORMAÇÕES BÁSICAS */}
                    <Text style={[styles.sectionTitle, { color: t('#4B5563', '#9CA3AF') }]}>Informações Básicas</Text>
                    <View style={[styles.card, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>
                        <Input control={control} name="name" label="Nome do manancial" placeholder="Ex: Igarapé do Tapajós" error={errors?.name?.message} />
                        <Input control={control} name="description" label="Descrição" placeholder="Breve descrição ou histórico" error={errors?.description?.message} />

                        {/* Picker Tipo */}
                        <Controller
                            control={control}
                            name="water_source_type_id"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>Tipo de manancial</Text>
                                    <View
                                        style={[
                                            styles.pickerWrapper,
                                            { backgroundColor: t('#F9FAFB', 'rgba(15,23,42,0.5)'), borderColor: t('#D1D5DB', '#374151') },
                                            errors.water_source_type_id && styles.inputError,
                                        ]}
                                    >
                                        <Picker
                                            selectedValue={value}
                                            style={[styles.picker, { color: t('#1F2937', '#F9FAFB') }]}
                                            dropdownIconColor={t('#1F2937', '#F9FAFB')}
                                            onValueChange={(val) => onChange(Number(val))}
                                        >
                                            <Picker.Item label="Selecione o tipo..." value={null} color={t('#9CA3AF', '#6B7280')} />
                                            {waterSourceTypes.map((item) => (
                                                <Picker.Item key={item.id} label={item.name} value={item.id} />
                                            ))}
                                        </Picker>
                                    </View>
                                    {errors.water_source_type_id && <Text style={styles.errorText}>{errors.water_source_type_id.message}</Text>}
                                </View>
                            )}
                        />

                        {/* Picker Classe */}
                        <Controller
                            control={control}
                            name="water_class_id"
                            render={({ field: { onChange, value } }) => (
                                <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                                    <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>Classe hídrica</Text>
                                    <View
                                        style={[
                                            styles.pickerWrapper,
                                            { backgroundColor: t('#F9FAFB', 'rgba(15,23,42,0.5)'), borderColor: t('#D1D5DB', '#374151') },
                                            errors.water_class_id && styles.inputError,
                                        ]}
                                    >
                                        <Picker
                                            selectedValue={value}
                                            style={[styles.picker, { color: t('#1F2937', '#F9FAFB') }]}
                                            dropdownIconColor={t('#1F2937', '#F9FAFB')}
                                            onValueChange={(val) => onChange(Number(val))}
                                        >
                                            <Picker.Item label="Selecione a classe..." value={null} color={t('#9CA3AF', '#6B7280')} />
                                            {waterClasses.map((item) => (
                                                <Picker.Item key={item.id} label={item.water_class} value={item.id} />
                                            ))}
                                        </Picker>
                                    </View>
                                    {errors.water_class_id && <Text style={styles.errorText}>{errors.water_class_id.message}</Text>}
                                </View>
                            )}
                        />
                    </View>

                    {/* CARD 2: DELIMITAÇÃO NO MAPA (Refinado para Expansão Horizontal) */}
                    <Text style={[styles.sectionTitle, { color: t('#4B5563', '#9CA3AF') }]}>Delimitação Geográfica</Text>
                    {/* Alterado para styles.mapCard (padding horizontal 0) */}
                    <View style={[styles.mapCard, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>

                        {/* Header do Mapa com Recuo Lateral (já que o card não tem) */}
                        <View style={styles.mapActionsHeader}>
                            <View style={styles.mapInstruction}>
                                <MapPin size={16} color={t('#6B7280', '#9CA3AF')} />
                                <Text style={[styles.instructionText, { color: t('#6B7280', '#9CA3AF') }]}>
                                    Toque para marcar os pontos
                                </Text>
                            </View>

                            {mapCoordinates.length > 0 && (
                                <TouchableOpacity onPress={handleClearMap} style={styles.clearMapButton}>
                                    <Trash2 size={16} color={t('#EF4444', '#F87171')} />
                                    <Text style={[styles.clearMapText, { color: t('#EF4444', '#F87171') }]}>Limpar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Wrapper do Mapa ocupando toda a largura interna do Card */}
                        <View style={styles.mapWrapperBleed}>
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={INITIAL_REGION}
                                onPress={onMapPress}
                                zoomEnabled
                                zoomTapEnabled
                            >
                                {/* Mananciais Existentes */}
                                {waterSources?.map((marker) => (
                                    <Polygon
                                        key={marker.id}
                                        coordinates={marker.coordinates}
                                        strokeColor="#9CA3AF"
                                        fillColor="rgba(156, 163, 175, 0.2)"
                                        strokeWidth={1}
                                    />
                                ))}

                                {/* Novo Manancial Sendo Marcado */}
                                {mapCoordinates.map((marker, index) => (
                                    <Marker
                                        key={index}
                                        coordinate={marker}
                                        title={`Ponto ${index + 1}`}
                                        draggable
                                        onDragEnd={(e) => onDragEnd(e, index)}
                                        pinColor="#2F80ED"
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
                        </View>

                        {/* Botão Importar CSV com Recuo Lateral (dentro do card sem padding) */}
                        <TouchableOpacity
                            onPress={handleImportCSV}
                            style={[styles.importButtonBleed, { backgroundColor: t('#F0F9FF', 'rgba(56,189,248,0.1)') }]}
                            activeOpacity={0.7}
                        >
                            <Upload size={18} color={t('#0284C7', '#38BDF8')} />
                            <Text style={[styles.importText, { color: t('#0284C7', '#38BDF8') }]}>
                                Ou importe um arquivo CSV
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Botões de Ação Finais */}
                    <View style={styles.buttonsContainer}>
                        <View style={{ flex: 1 }}>
                            <ButtonP
                                title="Salvar Rascunho"
                                variant="outline"
                                onPress={() => Alert.alert('Aviso', 'Funcionalidade em desenvolvimento')}
                            />
                        </View>
                        <View style={{ flex: 2 }}>
                            <ButtonP
                                title="Cadastrar Manancial"
                                onPress={handleSubmit(onSubmit)}
                            />
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // Reduzido padding lateral geral de 20 para 16 para uma UI menos apertada
    scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    // Header
    header: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 14, textAlign: 'center' },

    // Sections & Cards
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    // Card padrão (usado para inputs) mantém padding interno
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    // Card específico para o mapa (padding horizontal zerado para o mapa expandir)
    mapCard: {
        borderRadius: 20,
        paddingVertical: 20,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden', // Garante que o mapa respeite o border radius do card
    },

    // Formulário e Picker
    label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    inputGroup: { marginBottom: 16 },
    pickerWrapper: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        height: 52,
        justifyContent: 'center',
    },
    picker: { width: '100%', height: 50 },
    inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
    errorText: { color: '#EF4444', marginTop: 4, fontSize: 12, fontWeight: '500' },

    // Mapa e Ações
    // Adicionado padding horizontal aqui pois o card pai não tem mais
    mapActionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
    mapInstruction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    instructionText: { fontSize: 13, fontWeight: '500' },
    clearMapButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    clearMapText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    // Wrapper ocupando toda a largura interna do Card (blooming effect)
    mapWrapperBleed: {
        borderWidth: 1,
        borderColor: 'transparent',
    },
    map: {
        width: '100%',
        height: Dimensions.get('window').height * 0.50, // Mantido 50% da altura
    },

    // Import CSV dentro do card sem padding lateral
    importButtonBleed: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        marginHorizontal: 16, // Adicionado margem lateral para não encostar na borda do card
    },
    importText: { fontSize: 14, fontWeight: '600' },

    // Botões Bottom
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
    },
});