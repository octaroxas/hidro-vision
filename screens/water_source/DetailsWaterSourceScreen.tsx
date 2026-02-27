import api from '@/api/Axios';
import ButtonP from '@/components/form/Button';
import Input from '@/components/form/Input';
import ActionModal from '@/components/ui/action-modal';
import { useTheme } from '@/hooks/useTheme';
import { router } from '@/router/Router';
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from 'expo-router';
import { Droplets, FileText, Info, Plus, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { LatLng, Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_REGION = {
    latitude: -2.43007,
    longitude: -54.715307,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

type WaterSourceType = {
    id: number;
    name: string;
};

type CreatedBy = {
    id: number;
    name: string;
};

type WaterClass = {
    id: number;
    water_class: string;
};

type WaterSource = {
    id: number;
    name: string;
    description: string;
    water_source_type: WaterSourceType;
    water_class: WaterClass;
    created_by: CreatedBy;
    coordinates: LatLng[];
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

import { FormMonitoring } from '@/@types/types';
import MonitoringList from '@/components/monitoring-list';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { z } from "zod";
const schema = z.object({
    description: z.string(),
    water_source_id: z.number({ required_error: 'O ID do manancial é obrigatório!' }),
    user_id: z.number(),
});
export default function DetailsWaterSourceScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const [tab, setTab] = useState<'info' | 'map' | 'history'>('info');
    const [loading, setLoading] = useState(true);
    const { control, handleSubmit, formState: { errors } } = useForm<FormMonitoring>({
        resolver: zodResolver(schema),
        defaultValues: { water_source_id: Number(id), user_id: 1, description: '' },
    });
    const [waterSource, setWaterSource] = useState<WaterSource>();
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        async function getWaterSource() {
            try {
                const res = await api.get<{ data: WaterSource }>(`/water-sources/${id}`);
                const ws = res.data.data;
                setWaterSource({
                    ...ws,
                    coordinates: ws.coordinates.map((coord: LatLng) => ({
                        latitude: Number(coord.latitude),
                        longitude: Number(coord.longitude),
                    })),
                });
            } catch (error) {
                console.error('Erro ao buscar manancial:', error);
            } finally {
                setLoading(false);
            }
        }
        getWaterSource();
    }, []);

    function getPolygonCenter(coordinates: LatLng[]): LatLng {
        const latSum = coordinates.reduce((sum, c) => sum + c.latitude, 0);
        const lngSum = coordinates.reduce((sum, c) => sum + c.longitude, 0);
        return {
            latitude: latSum / coordinates.length,
            longitude: lngSum / coordinates.length,
        };
    }

    const openMaps = async (lat?: number, lng?: number) => {
        if (!lat || !lng) return;
        const url = `https://maps.google.com/maps?q=${lat},${lng}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
    };

    const destroy = async () => {
        Alert.alert(
            'Exclusão de manancial',
            'Deseja realmente excluir este manancial?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/water-sources/${id}`);
                            Alert.alert('Sucesso', 'Manancial excluído!');
                            router.replace('/(tabs)');
                        } catch {
                            Alert.alert('Erro', 'Não foi possível excluir o manancial.');
                        }
                    },
                },
            ]
        );
    };

    const onSubmit = async (data: FormMonitoring) => {

        const payload = {
            ...data
        };

        setLoading(true);
        try {
            const res = await api.post('/water-sources/monitorings/store', payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            Alert.alert('Sucesso', `Novo monitoramento cadastrado!`);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
            if (isAxiosError(error) && error.response) {
                Alert.alert('Erro', error.response.data.message);
            } else {
                Alert.alert('Erro', 'Não foi possível cadastrar o monitoramento.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: t('#F9FAFB', '#111827') }]}>
                <ActivityIndicator color={t('#2F80ED', '#60A5FA')} size="large" />
                <Text style={{ color: t('#6B7280', '#9CA3AF'), marginTop: 12, fontWeight: '500' }}>
                    Carregando informações...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Banner */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: 'https://conceitos.com/wp-content/uploads/ecologia/manancial.jpg',
                        }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={[styles.imageOverlay, { backgroundColor: isDark ? 'rgba(17,24,39,0.4)' : 'transparent' }]} />
                </View>

                {/* Header (Sobreposto à imagem) */}
                <View style={[styles.header, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>
                    <View style={[styles.iconCircle, { backgroundColor: t('#E0E7FF', 'rgba(96,165,250,0.15)'), borderColor: t('#FFFFFF', '#1E293B') }]}>
                        <Droplets size={34} color={t('#2F80ED', '#60A5FA')} />
                    </View>
                    <Text style={[styles.title, { color: t('#111827', '#F9FAFB') }]}>
                        {waterSource?.name}
                    </Text>
                    <View style={styles.badge}>
                        <Info size={14} color={t('#6B7280', '#9CA3AF')} style={{ marginRight: 4 }} />
                        <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>
                            {waterSource?.water_source_type?.name}
                        </Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: t('#F3F4F6', '#1E293B') }]}>
                    {['info', 'map', 'history'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            activeOpacity={0.7}
                            onPress={() => setTab(item as any)}
                            style={[
                                styles.tab,
                                tab === item && {
                                    backgroundColor: t('#FFFFFF', '#374151'),
                                    ...styles.tabActiveShadow
                                }
                            ]}
                        >
                            <Text
                                style={{
                                    color: tab === item ? t('#2F80ED', '#60A5FA') : t('#6B7280', '#9CA3AF'),
                                    fontWeight: tab === item ? '700' : '500',
                                    fontSize: 14,
                                }}
                            >
                                {item === 'info' ? 'Informações' : item === 'map' ? 'Mapa' : 'Histórico'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Conteúdo Dinâmico */}
                <View style={[styles.card, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#F3F4F6', '#374151') }]}>

                    {/* ABA: INFORMAÇÕES */}
                    {tab === 'info' && (
                        <View style={styles.infoContent}>
                            <View style={[styles.infoRow, { borderBottomColor: t('#F3F4F6', '#374151') }]}>
                                <View style={[styles.infoIconWrapper, { backgroundColor: t('#F0F9FF', 'rgba(56,189,248,0.1)') }]}>
                                    <Droplets size={20} color={t('#0284C7', '#38BDF8')} />
                                </View>
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.label, { color: t('#6B7280', '#9CA3AF') }]}>Classe hídrica</Text>
                                    <Text style={[styles.info, { color: t('#111827', '#F9FAFB') }]}>
                                        {waterSource?.water_class?.water_class}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.infoRow, { borderBottomColor: t('#F3F4F6', '#374151') }]}>
                                <View style={[styles.infoIconWrapper, { backgroundColor: t('#F3F4F6', 'rgba(156,163,175,0.1)') }]}>
                                    <User size={20} color={t('#4B5563', '#9CA3AF')} />
                                </View>
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.label, { color: t('#6B7280', '#9CA3AF') }]}>Cadastrado por</Text>
                                    <Text style={[styles.info, { color: t('#111827', '#F9FAFB') }]}>
                                        {waterSource?.created_by?.name}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                                <View style={[styles.infoIconWrapper, { backgroundColor: t('#FEF3C7', 'rgba(251,191,36,0.1)') }]}>
                                    <FileText size={20} color={t('#D97706', '#FBBF24')} />
                                </View>
                                <View style={styles.infoTextWrapper}>
                                    <Text style={[styles.label, { color: t('#6B7280', '#9CA3AF') }]}>Descrição</Text>
                                    <Text style={[styles.info, { color: t('#374151', '#D1D5DB') }]}>
                                        {waterSource?.description || 'Nenhuma descrição detalhada foi fornecida para este manancial.'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.actionButtons}>
                                <View style={styles.buttonWrapper}>
                                    <ButtonP
                                        title="Excluir"
                                        variant="outline"
                                        onPress={destroy}
                                    />
                                </View>
                                <View style={styles.buttonWrapper}>
                                    <ButtonP
                                        title="Abrir no Maps"
                                        onPress={() =>
                                            openMaps(
                                                waterSource?.coordinates[0]?.latitude,
                                                waterSource?.coordinates[0]?.longitude
                                            )
                                        }
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ABA: MAPA */}
                    {tab === 'map' && (
                        <View style={styles.mapContainer}>
                            <MapView
                                style={styles.map}
                                initialRegion={
                                    waterSource?.coordinates?.length
                                        ? {
                                            ...getPolygonCenter(waterSource.coordinates),
                                            latitudeDelta: 0.02,
                                            longitudeDelta: 0.02,
                                        }
                                        : INITIAL_REGION
                                }
                            >
                                {waterSource?.coordinates && (
                                    <Polygon
                                        coordinates={waterSource.coordinates}
                                        strokeColor="#2563EB"
                                        fillColor="rgba(37,99,235,0.3)"
                                        strokeWidth={2}
                                    />
                                )}
                                {waterSource && (
                                    <Marker
                                        title={waterSource.name}
                                        coordinate={getPolygonCenter(waterSource.coordinates)}
                                    />
                                )}
                            </MapView>
                        </View>
                    )}

                    {/* ABA: HISTÓRICO */}
                    {tab === 'history' && (
                        <View style={styles.historyContainer}>
                            {/* <View style={[styles.emptyStateIcon, { backgroundColor: t('#F3F4F6', '#374151') }]}>
                                <MapIcon size={32} color={t('#9CA3AF', '#6B7280')} />
                            </View> */}
                            <View style={{ width: '100%' }}>
                                <ButtonP onPress={() => setModalVisible(true)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Plus color={'white'} size={20} />
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Novo Monitoramento</Text>
                                    </View>
                                </ButtonP>
                            </View>

                            <MonitoringList waterSourceId={Number(id)} />

                            {/* MODAL MANTIDO COM ESTILIZAÇÃO ORIGINAL */}
                            <ActionModal
                                title="Registrar Monitoramento"
                                visible={modalVisible}
                                onClose={() => setModalVisible(false)}
                            >
                                {/* Tudo o que você colocar aqui dentro aparecerá no modal */}
                                <Text style={{ color: t('#6B7280', '#9CA3AF'), marginBottom: 16 }}>
                                    Preencha os dados do novo monitoramento abaixo.
                                </Text>

                                <View>
                                    <Input placeholder='Informe a descrição' name='description' control={control} label='Descrição' />
                                </View>

                                {/* Exemplo de botão no form */}
                                <ButtonP title="Salvar" onPress={handleSubmit(onSubmit)} />
                            </ActionModal>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header & Banner
    imageContainer: { width: '100%', height: 220, position: 'relative' },
    image: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 0,
        marginHorizontal: 16,
        marginTop: -40, // Sobrepõe a imagem levemente
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -36, // Metade para fora do card
        marginBottom: 12,
        borderWidth: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 6,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    subtitle: { fontSize: 14, fontWeight: '600' },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 24,
        padding: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    tabActiveShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    // Content Card
    card: {
        borderRadius: 20,
        borderWidth: 1,
        marginHorizontal: 16,
        marginTop: 16,
        overflow: 'hidden',
    },

    // Info Tab Layout
    infoContent: { padding: 20 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    infoIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextWrapper: { flex: 1, justifyContent: 'center' },
    label: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    info: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
    },

    // Botões info
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    buttonWrapper: { flex: 1 },

    // Map Tab
    mapContainer: { width: '100%', height: Dimensions.get('window').height * 0.45 },
    map: { width: '100%', height: '100%' },

    // History Tab
    historyContainer: {
        alignItems: 'center',
        padding: 10,
    },
    emptyStateIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyStateText: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 10,
    }
});