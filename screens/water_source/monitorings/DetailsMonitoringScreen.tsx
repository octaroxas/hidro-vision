import api from '@/api/Axios';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams } from 'expo-router';
import { Activity, AlignLeft, Bug, Calendar, CheckCircle, ClipboardCheck, Droplet, TestTube, Thermometer, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tipagem baseada na estrutura de monitoramento anterior
type WaterSource = {
    id: number;
    name: string;
};

type MonitoringUser = {
    id: number;
    name: string;
    email: string;
};

type MonitoringDetail = {
    id: number;
    description: string;
    user: MonitoringUser;
    water_source: WaterSource;
    created_at: string;
};

// --- Dados Fake para as seções de parâmetros ---
const fakeFisicoQuimicos = [
    { id: 1, name: 'pH', value: '7.2', unit: '', status: 'Normal', icon: TestTube },
    { id: 2, name: 'Temperatura', value: '24.5', unit: '°C', status: 'Normal', icon: Thermometer },
    { id: 3, name: 'Turbidez', value: '12.0', unit: 'NTU', status: 'Atenção', icon: Activity },
    { id: 4, name: 'Oxigênio', value: '6.5', unit: 'mg/L', status: 'Normal', icon: Droplet },
];

const fakeMicrobiologicos = [
    { id: 1, name: 'Coliformes', value: 'Ausente', unit: '', status: 'Normal', icon: Bug },
    { id: 2, name: 'E. Coli', value: 'Ausente', unit: '', status: 'Normal', icon: CheckCircle },
];

export default function DetailsMonitoringScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const [monitoring, setMonitoring] = useState<MonitoringDetail>();
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'info' | 'analyses'>('info');

    useEffect(() => {
        async function fetchMonitoringDetail() {
            try {
                const res = await api.get<{ data: MonitoringDetail }>(`/monitorings/${id}`);
                setMonitoring(res.data.data);
            } catch (error) {
                console.error('Erro ao buscar detalhes do monitoramento:', error);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchMonitoringDetail();
        }
    }, [id]);

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '';
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        return `${day}/${month}/${year} às ${hour}:${minute}`;
    };

    const getStatusColor = (status: string) => {
        if (status === 'Normal') return t('#059669', '#34D399');
        if (status === 'Atenção') return t('#D97706', '#FBBF24');
        return t('#EF4444', '#F87171');
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.center, { backgroundColor: t('#F9FAFB', '#111827') }]}>
                <ActivityIndicator color={t('#2F80ED', '#60A5FA')} size="large" />
                <Text style={{ color: t('#6B7280', '#9CA3AF'), marginTop: 12, fontWeight: '500' }}>
                    Carregando detalhes...
                </Text>
            </SafeAreaView>
        );
    }

    if (!monitoring) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.center, { backgroundColor: t('#F9FAFB', '#111827') }]}>
                <Text style={{ color: t('#EF4444', '#F87171'), fontSize: 16, fontWeight: '600' }}>
                    Monitoramento não encontrado.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Cabeçalho da Tela */}
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: t('#E0E7FF', 'rgba(96,165,250,0.15)') }]}>
                        <ClipboardCheck size={32} color={t('#2F80ED', '#60A5FA')} />
                    </View>
                    <Text style={[styles.title, { color: t('#111827', '#F9FAFB') }]}>
                        Detalhes do Registro
                    </Text>
                    <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>
                        ID do Monitoramento: #{monitoring.id}
                    </Text>
                </View>

                {/* Tabs (Abas) */}
                <View style={[styles.tabContainer, { backgroundColor: t('#F3F4F6', '#1E293B') }]}>
                    {['info', 'analyses'].map((item) => (
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
                                {item === 'info' ? 'Informações' : 'Análises'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ABA: INFORMAÇÕES GERAIS (Layout Compacto) */}
                {tab === 'info' && (
                    <View style={[styles.compactCard, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>

                        {/* Linha 1: Manancial e Usuário dividindo a tela */}
                        <View style={[styles.compactRow, { borderBottomColor: t('#F3F4F6', '#374151') }]}>
                            <View style={styles.compactCol}>
                                <View style={styles.compactLabelContainer}>
                                    <Droplet size={14} color={t('#0284C7', '#38BDF8')} />
                                    <Text style={[styles.compactLabel, { color: t('#6B7280', '#9CA3AF') }]}>Manancial</Text>
                                </View>
                                <Text style={[styles.compactValue, { color: t('#111827', '#F9FAFB') }]} numberOfLines={1}>
                                    {monitoring.water_source?.name || 'Não informado'}
                                </Text>
                            </View>

                            {/* Separador vertical sutil */}
                            <View style={[styles.verticalDivider, { backgroundColor: t('#F3F4F6', '#374151') }]} />

                            <View style={styles.compactCol}>
                                <View style={styles.compactLabelContainer}>
                                    <User size={14} color={t('#4B5563', '#9CA3AF')} />
                                    <Text style={[styles.compactLabel, { color: t('#6B7280', '#9CA3AF') }]}>Registrado por</Text>
                                </View>
                                <Text style={[styles.compactValue, { color: t('#111827', '#F9FAFB') }]} numberOfLines={1}>
                                    {monitoring.user?.name}
                                </Text>
                            </View>
                        </View>

                        {/* Linha 2: Data (Largura total) */}
                        <View style={[styles.compactRow, { borderBottomColor: t('#F3F4F6', '#374151') }]}>
                            <View style={styles.compactColFull}>
                                <View style={styles.compactLabelContainer}>
                                    <Calendar size={14} color={t('#059669', '#34D399')} />
                                    <Text style={[styles.compactLabel, { color: t('#6B7280', '#9CA3AF') }]}>Data e Hora do Registro</Text>
                                </View>
                                <Text style={[styles.compactValue, { color: t('#111827', '#F9FAFB') }]}>
                                    {formatDateTime(monitoring.created_at)}
                                </Text>
                            </View>
                        </View>

                        {/* Linha 3: Descrição */}
                        <View style={[styles.compactRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <View style={styles.compactColFull}>
                                <View style={styles.compactLabelContainer}>
                                    <AlignLeft size={14} color={t('#D97706', '#FBBF24')} />
                                    <Text style={[styles.compactLabel, { color: t('#6B7280', '#9CA3AF') }]}>Descrição da Análise</Text>
                                </View>
                                <Text style={[styles.compactDescription, { color: t('#4B5563', '#D1D5DB') }]}>
                                    {monitoring.description || 'Nenhuma descrição detalhada foi fornecida para este monitoramento.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ABA: ANÁLISES (Estrutura Grid) */}
                {tab === 'analyses' && (
                    <View>
                        <Text style={[styles.subSectionTitle, { color: t('#4B5563', '#9CA3AF') }]}>Físico-Químicos</Text>
                        <View style={styles.grid}>
                            {fakeFisicoQuimicos.map((param) => (
                                <View key={param.id} style={[styles.paramCard, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>
                                    <View style={styles.paramHeader}>
                                        <param.icon size={18} color={t('#6B7280', '#9CA3AF')} />
                                        <Text style={[styles.paramStatus, { color: getStatusColor(param.status) }]}>
                                            {param.status}
                                        </Text>
                                    </View>
                                    <Text style={[styles.paramName, { color: t('#6B7280', '#9CA3AF') }]} numberOfLines={1}>
                                        {param.name}
                                    </Text>
                                    <View style={styles.paramValueContainer}>
                                        <Text style={[styles.paramValue, { color: t('#111827', '#F9FAFB') }]}>{param.value}</Text>
                                        {param.unit ? (
                                            <Text style={[styles.paramUnit, { color: t('#6B7280', '#9CA3AF') }]}>{param.unit}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.subSectionTitle, { color: t('#4B5563', '#9CA3AF'), marginTop: 8 }]}>Microbiológicos</Text>
                        <View style={styles.grid}>
                            {fakeMicrobiologicos.map((param) => (
                                <View key={param.id} style={[styles.paramCard, { backgroundColor: t('#FFFFFF', '#1E293B'), borderColor: t('#E5E7EB', '#374151') }]}>
                                    <View style={styles.paramHeader}>
                                        <param.icon size={18} color={t('#6B7280', '#9CA3AF')} />
                                        <Text style={[styles.paramStatus, { color: getStatusColor(param.status) }]}>
                                            {param.status}
                                        </Text>
                                    </View>
                                    <Text style={[styles.paramName, { color: t('#6B7280', '#9CA3AF') }]} numberOfLines={1}>
                                        {param.name}
                                    </Text>
                                    <View style={styles.paramValueContainer}>
                                        <Text style={[styles.paramValue, { color: t('#111827', '#F9FAFB') }]}>{param.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    header: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 14, fontWeight: '500' },

    tabContainer: { flexDirection: 'row', borderRadius: 12, marginBottom: 24, padding: 4 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
    tabActiveShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },

    // NOVOS ESTILOS PARA O LAYOUT COMPACTO
    compactCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    compactRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    compactCol: {
        flex: 1,
        justifyContent: 'center',
    },
    compactColFull: {
        width: '100%',
        justifyContent: 'center',
    },
    verticalDivider: {
        width: 1,
        marginHorizontal: 16,
    },
    compactLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    compactLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    compactValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    compactDescription: {
        fontSize: 14,
        lineHeight: 22,
        marginTop: 2,
    },

    // Estilos da aba de Análises (Grid)
    subSectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    paramCard: { width: '48%', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    paramHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    paramStatus: { fontSize: 12, fontWeight: '700' },
    paramName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    paramValueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    paramValue: { fontSize: 22, fontWeight: '800' },
    paramUnit: { fontSize: 14, fontWeight: '600' },
});