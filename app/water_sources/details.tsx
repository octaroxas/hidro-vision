import ButtonP from '@/components/form/Button';
import { useTheme } from '@/hooks/useTheme';
import { router } from '@/router/Router';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { Droplets } from 'lucide-react-native';
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
    View,
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

export default function DetailsWaterSourceScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const [tab, setTab] = useState<'info' | 'map' | 'history'>('info');
    const [loading, setLoading] = useState(true);
    const [waterSource, setWaterSource] = useState<WaterSource>();

    useEffect(() => {
        async function getWaterSource() {
            try {
                const res = await axios.get<{ data: WaterSource }>(
                    `https://api-mananciais.yuresamarone.shop/api/v1/water-sources/${id}`
                );
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
                            await axios.delete(
                                `https://api-mananciais.yuresamarone.shop/api/v1/water-sources/${id}`
                            );
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={t('#2F80ED', '#60A5FA')} size="large" />
                <Text style={{ color: t('#111827', '#F9FAFB'), marginTop: 10 }}>
                    Carregando informações...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner */}
                <Image
                    source={{
                        uri:
                            'https://conceitos.com/wp-content/uploads/ecologia/manancial.jpg',
                    }}
                    style={styles.image}
                    resizeMode="cover"
                />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: t('#FFFFFF', '#1E293B') }]}>
                    <View style={styles.iconCircle}>
                        <Droplets size={32} color={t('#2F80ED', '#60A5FA')} />
                    </View>
                    <Text style={[styles.title, { color: t('#111827', '#F9FAFB') }]}>
                        {waterSource?.name}
                    </Text>
                    <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>
                        {waterSource?.water_source_type?.name}
                    </Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    {['info', 'map', 'history'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setTab(item as any)}
                            style={[
                                styles.tab,
                                tab === item
                                    ? { backgroundColor: t('#E5E7EB', '#374151') }
                                    : { backgroundColor: t('#F3F4F6', '#1E293B') },
                            ]}
                        >
                            <Text
                                style={{
                                    color: tab === item ? t('#111827', '#F9FAFB') : t('#9CA3AF', '#6B7280'),
                                    fontWeight: '600',
                                }}
                            >
                                {item === 'info'
                                    ? 'Informações'
                                    : item === 'map'
                                        ? 'Mapa'
                                        : 'Histórico'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Conteúdo */}
                <View style={[styles.card, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>
                    {tab === 'info' && (
                        <View>
                            <Text style={[styles.label, { color: t('#6B7280', '#9CA3AF') }]}>Classe hídrica</Text>
                            <Text style={[styles.info, { color: t('#111827', '#F9FAFB') }]}>
                                {waterSource?.water_class?.water_class}
                            </Text>

                            <Text style={[styles.label, { color: t('#6B7280', '#9CA3AF') }]}>Cadastrado por</Text>
                            <Text style={[styles.info, { color: t('#111827', '#F9FAFB') }]}>
                                {waterSource?.created_by?.name}
                            </Text>

                            <Text style={[styles.label, { color: t('#6B7280', '#9CA3AF') }]}>Descrição</Text>
                            <Text style={[styles.info, { color: t('#374151', '#D1D5DB') }]}>
                                {waterSource?.description || 'Sem descrição disponível.'}
                            </Text>

                            <View style={styles.buttonRow}>
                                <ButtonP
                                    size="sm"
                                    title="Abrir com Maps"
                                    onPress={() =>
                                        openMaps(
                                            waterSource?.coordinates[0]?.latitude,
                                            waterSource?.coordinates[0]?.longitude
                                        )
                                    }
                                />
                                <ButtonP
                                    size="sm"
                                    variant="outline"
                                    title="Excluir"
                                    onPress={destroy}
                                />
                            </View>
                        </View>
                    )}

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

                    {tab === 'history' && (
                        <View style={styles.historyContainer}>
                            <Text style={{ color: t('#6B7280', '#9CA3AF') }}>
                                Histórico de monitoramento ainda não disponível.
                            </Text>
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
    image: { width: '100%', height: 250 },
    header: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    iconCircle: {
        backgroundColor: 'rgba(37,99,235,0.1)',
        borderRadius: 40,
        padding: 12,
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        marginHorizontal: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 10,
        marginHorizontal: 5,
        paddingVertical: 10,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        margin: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 12,
    },
    info: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
        gap: 10,
        marginTop: 12,
    },
    mapContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 12,
    },
    map: {
        height: Dimensions.get('window').height * 0.35,
        width: '100%',
    },
    historyContainer: {
        alignItems: 'center',
        padding: 20,
    },
});