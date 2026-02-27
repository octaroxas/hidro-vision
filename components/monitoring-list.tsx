import api from '@/api/Axios';
import { useTheme } from '@/hooks/useTheme';
import { Calendar, ClipboardList, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Tipagens baseadas no JSON fornecido
type MonitoringUser = {
    id: number;
    name: string;
    email: string;
};

type Monitoring = {
    id: number;
    description: string;
    user: MonitoringUser;
    created_at: string; // Ex: "2025-12-02 18:07:01"
};

interface MonitoringListProps {
    waterSourceId: number;
}

export default function MonitoringList({ waterSourceId }: MonitoringListProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const [monitorings, setMonitorings] = useState<Monitoring[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMonitorings() {
            try {
                // Rota da API baseada no seu JSON
                const res = await api.get<{ data: Monitoring[] }>(`/water-sources/${waterSourceId}/monitorings`);
                // Ordena do mais recente para o mais antigo (opcional, mas recomendado)
                const sortedData = res.data.data.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setMonitorings(sortedData);
            } catch (error) {
                console.error('Erro ao buscar monitoramentos:', error);
            } finally {
                setLoading(false);
            }
        }

        if (waterSourceId) {
            fetchMonitorings();
        }
    }, [waterSourceId]);

    // Função para formatar a data que vem da API ("2025-12-02 18:07:01" -> "02/12/2025")
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const [datePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={t('#2F80ED', '#60A5FA')} size="small" />
                <Text style={{ color: t('#6B7280', '#9CA3AF'), marginTop: 8 }}>
                    Buscando histórico...
                </Text>
            </View>
        );
    }

    if (monitorings.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: t('#F3F4F6', '#374151') }]}>
                    <ClipboardList size={28} color={t('#9CA3AF', '#6B7280')} />
                </View>
                <Text style={[styles.emptyText, { color: t('#6B7280', '#9CA3AF') }]}>
                    Nenhum monitoramento registrado para este manancial ainda.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {monitorings.map((item) => (
                <View
                    key={item.id}
                    style={[
                        styles.card,
                        {
                            backgroundColor: t('#F9FAFB', '#1F2937'),
                            borderColor: t('#E5E7EB', '#374151')
                        }
                    ]}
                >
                    {/* Cabeçalho do Card (Data e Usuário) */}
                    <View style={[styles.cardHeader, { borderBottomColor: t('#E5E7EB', '#374151') }]}>
                        <View style={styles.row}>
                            <Calendar size={16} color={t('#6B7280', '#9CA3AF')} />
                            <Text style={[styles.dateText, { color: t('#4B5563', '#9CA3AF') }]}>
                                {formatDate(item.created_at)}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <User size={16} color={t('#2F80ED', '#60A5FA')} />
                            <Text style={[styles.userText, { color: t('#111827', '#F9FAFB') }]}>
                                {item.user.name}
                            </Text>
                        </View>
                    </View>

                    {/* Corpo do Card (Descrição) */}
                    <View style={styles.cardBody}>
                        <Text style={[styles.descriptionLabel, { color: t('#6B7280', '#9CA3AF') }]}>
                            Descrição inicial
                        </Text>
                        <Text style={[styles.descriptionText, { color: t('#111827', '#E5E7EB') }]}>
                            {item.description}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 8,
    },
    center: {
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    card: {
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '500',
    },
    userText: {
        fontSize: 13,
        fontWeight: '600',
    },
    cardBody: {
        padding: 16,
    },
    descriptionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
});