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
import { AlertCircle, CheckCircle, Droplets, MapPin, Trash2, Upload } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Animated,
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

    // === SISTEMA DE TOAST CUSTOMIZADO ===
    const slideAnim = useRef(new Animated.Value(-100)).current; // Começa fora da tela (topo)
    const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' as 'success' | 'error' });

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToastConfig({ message, type });
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: Platform.OS === 'ios' ? 60 : 40, duration: 300, useNativeDriver: true }),
            Animated.delay(2500),
            Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true })
        ]).start();
    }, [slideAnim]);
    // ===================================

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
                showToast('Erro ao carregar dados iniciais.', 'error');
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
                showToast('O arquivo precisa ter pelo menos 3 coordenadas.', 'error');
                return;
            }

            setMapCoordinates(parsedCoords);
            showToast(`${parsedCoords.length} coordenadas importadas!`, 'success');
        } catch (err: any) {
            console.error('Erro ao importar CSV:', err);
            showToast('Falha ao ler CSV. Verifique o formato.', 'error');
        }
    };

    const onSubmit = async (data: FormWaterSource) => {
        if (mapCoordinates.length < 3) {
            showToast('Marque no mínimo 3 pontos no mapa!', 'error');
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

            showToast(`${res.data.data.name} cadastrado com sucesso!`, 'success');

            // Aguarda 2 segundos para o usuário ver o Toast de sucesso antes de navegar
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 2000);

        } catch (error) {
            setLoading(false); // Só tira o loading se der erro. Se der sucesso, mantém a tela travada até navegar.
            console.error(error);
            if (isAxiosError(error) && error.response) {
                showToast(error.response.data.message || 'Erro ao cadastrar manancial.', 'error');
            } else {
                showToast('Não foi possível conectar ao servidor.', 'error');
            }
        }
    };

    if (loading && !toastConfig.message.includes('sucesso')) {
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

            {/* COMPONENTE DO TOAST ANIMADO */}
            <Animated.View style={[
                styles.toastContainer,
                {
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: toastConfig.type === 'success' ? t('#ECFDF5', '#022C22') : t('#FEF2F2', '#450A0A'),
                    borderColor: toastConfig.type === 'success' ? t('#10B981', '#059669') : t('#EF4444', '#DC2626'),
                }
            ]}>
                {toastConfig.type === 'success' ? (
                    <CheckCircle color={t('#10B981', '#34D399')} size={24} />
                ) : (
                    <AlertCircle color={t('#EF4444', '#F87171')} size={24} />
                )}
                <Text style={[
                    styles.toastText,
                    { color: toastConfig.type === 'success' ? t('#064E3B', '#D1FAE5') : t('#7F1D1D', '#FEE2E2') }
                ]}>
                    {toastConfig.message}
                </Text>
            </Animated.View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Cabeçalho */}
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

                    {/* CARD 2: DELIMITAÇÃO NO MAPA */}
                    <Text style={[styles.sectionTitle, { color: t('#4B5563', '#9CA3AF') }]}>Delimitação Geográfica</Text>
                    <View style={[styles.mapCard, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>
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

                        <View style={styles.mapWrapperBleed}>
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
                                        strokeColor="#9CA3AF"
                                        fillColor="rgba(156, 163, 175, 0.2)"
                                        strokeWidth={1}
                                    />
                                ))}

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

                    {/* Botões Finais */}
                    <View style={styles.buttonsContainer}>
                        <View style={{ flex: 1 }}>
                            <ButtonP
                                title="Cancelar"
                                variant="outline"
                                onPress={() => router.back()}
                            />
                        </View>
                        <View style={{ flex: 2 }}>
                            <ButtonP
                                title="Cadastrar Manancial"
                                onPress={handleSubmit(onSubmit)}
                                disabled={loading}
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
    scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    // Toast Animado
    toastContainer: {
        position: 'absolute',
        top: 0, // A animação cuida de trazer ele para baixo
        left: 16,
        right: 16,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    toastText: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },

    // Header
    header: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    appTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 14, textAlign: 'center' },

    // Sections & Cards
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    card: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    mapCard: { borderRadius: 20, paddingVertical: 20, borderWidth: 1, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },

    // Formulário e Picker
    label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    inputGroup: { marginBottom: 16 },
    pickerWrapper: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', height: 52, justifyContent: 'center' },
    picker: { width: '100%', height: 50 },
    inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
    errorText: { color: '#EF4444', marginTop: 4, fontSize: 12, fontWeight: '500' },

    // Mapa e Ações
    mapActionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
    mapInstruction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    instructionText: { fontSize: 13, fontWeight: '500' },
    clearMapButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    clearMapText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    mapWrapperBleed: { borderWidth: 1, borderColor: 'transparent' },
    map: { width: '100%', height: Dimensions.get('window').height * 0.50 },

    // Import CSV
    importButtonBleed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 14, marginTop: 16, marginHorizontal: 16 },
    importText: { fontSize: 14, fontWeight: '600' },

    // Botões Bottom
    buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
});