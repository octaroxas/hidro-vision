import api from '@/api/Axios';
import ButtonP from '@/components/form/Button'; // <-- Importado o botão customizado
import ActionModal from '@/components/ui/action-modal'; // <-- Importado o modal reutilizável
import { useTheme } from '@/hooks/useTheme';
import { Calendar, ClipboardList, Trash2, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

    // Estados para o Modal de Exclusão
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [monitoringToDelete, setMonitoringToDelete] = useState<number | null>(null);

    useEffect(() => {
        async function fetchMonitorings() {
            try {
                const res = await api.get<{ data: Monitoring[] }>(`/water-sources/${waterSourceId}/monitorings`);
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

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const [datePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
    };

    // Abre o modal e salva qual ID será excluído
    const openDeleteModal = (id: number) => {
        setMonitoringToDelete(id);
        setIsDeleteModalVisible(true);
    };

    // Função que executa a exclusão
    const handleDelete = async () => {
        if (!monitoringToDelete) return;

        try {
            // TODO: Aqui você adiciona a chamada de deleção da sua API
            // await api.delete(`/monitorings/${monitoringToDelete}`);

            // Atualiza a lista localmente para refletir a exclusão na hora
            setMonitorings((prev) => prev.filter((m) => m.id !== monitoringToDelete));

        } catch (error) {
            console.error('Erro ao excluir o monitoramento:', error);
        } finally {
            // Fecha o modal e limpa o ID selecionado
            setIsDeleteModalVisible(false);
            setMonitoringToDelete(null);
        }
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
                    {/* Cabeçalho do Card */}
                    <View style={[styles.cardHeader, { borderBottomColor: t('#E5E7EB', '#374151') }]}>
                        {/* Agrupei a data e o usuário para ficarem à esquerda */}
                        <View style={styles.headerInfo}>
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

                        {/* Botão de excluir à direita */}
                        <TouchableOpacity
                            onPress={() => openDeleteModal(item.id)}
                            style={[styles.deleteButton, { backgroundColor: t('#FEE2E2', 'rgba(248, 113, 113, 0.15)') }]}
                        >
                            <Trash2 size={18} color={t('#EF4444', '#F87171')} />
                        </TouchableOpacity>
                    </View>

                    {/* Corpo do Card (Descrição) */}
                    <View style={styles.cardBody}>
                        <Text style={[styles.descriptionLabel, { color: t('#6B7280', '#9CA3AF') }]}>
                            Descrição da análise
                        </Text>
                        <Text style={[styles.descriptionText, { color: t('#111827', '#E5E7EB') }]}>
                            {item.description}
                        </Text>
                    </View>
                </View>
            ))}

            {/* Modal de Exclusão injetado ao final da lista */}
            <ActionModal
                title="Excluir Monitoramento"
                visible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
            >
                <Text style={[styles.modalMessage, { color: t('#4B5563', '#9CA3AF') }]}>
                    Tem certeza que deseja excluir permanentemente este monitoramento? Esta ação não poderá ser desfeita.
                </Text>

                <View style={styles.modalActions}>
                    <View style={{ flex: 1 }}>
                        <ButtonP
                            title="Cancelar"
                            variant="outline"
                            onPress={() => setIsDeleteModalVisible(false)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ButtonP
                            title="Excluir"
                            onPress={handleDelete}
                        // Se o seu ButtonP suportar cor customizada, você pode passar uma cor vermelha aqui
                        />
                    </View>
                </View>
            </ActionModal>
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
    headerInfo: {
        flexDirection: 'row',
        gap: 16,
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
    deleteButton: {
        padding: 8,
        borderRadius: 8,
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
    // Estilos do Modal interno
    modalMessage: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    }
});