import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { LogOut, Moon, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalLists: 0, totalValue: 0 });
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const confirmLogout = () => setLogoutModalVisible(true);

    const handleLogout = async () => {
        // try {
        //     await supabase.auth.signOut();
        //     setLogoutModalVisible(false);
        //     router.replace('/login');
        // } catch (err) {
        //     console.error('Erro ao sair:', err);
        //     Alert.alert('Erro', 'Não foi possível encerrar a sessão.');
        // }
    };

    // // 🔹 Enquanto carrega
    // if (loading) {
    //     return (
    //         <View
    //             style={[
    //                 styles.loadingContainer,
    //                 { backgroundColor: t('#F9FAFB', '#111827') },
    //             ]}
    //         >
    //             <ActivityIndicator size="large" color={t('#2F80ED', '#60A5FA')} />
    //         </View>
    //     );
    // }
    return (
        <View style={[styles.container, { backgroundColor: t('#F9FAFB', '#111827') }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: t('#FFFFFF', '#1F2937'), borderBottomColor: t('#E5E7EB', '#374151') }]}>
                <View>
                    <Text style={[styles.title, { color: t('#1F2937', '#F9FAFB') }]}>Perfil</Text>
                    <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>Informações da sua conta</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, backgroundColor: t('#FFFFFF', '#1F2937'), borderRadius: 12, padding: 6 }}>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={[styles.themeButton, { backgroundColor: t('#F3F4F6', '#374151') }]}
                    >
                        {isDark ? <Sun size={22} color="#FACC15" /> : <Moon size={22} color="#2F80ED" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={confirmLogout}
                        style={[styles.logoutButton, { backgroundColor: t('#FEE2E2', '#7F1D1D') }]}
                    >
                        <LogOut size={22} color={t('#EF4444', '#FCA5A5')} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Perfil do usuário */}
            <View style={styles.profileSection}>
                <View style={[styles.profileCard, { backgroundColor: t('#FFFFFF', '#1F2937'), borderWidth: isDark ? 1 : 0, borderColor: isDark ? '#374151' : 'transparent' }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: t('#2F80ED', '#2563EB') }]}>
                            <Text style={styles.avatarText}>
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: t('#1F2937', '#F9FAFB') }]}>
                                {user?.user_metadata?.name || user?.email}
                            </Text>
                            <Text style={[styles.userEmail, { color: t('#6B7280', '#D1D5DB') }]}>{user?.email}</Text>
                            <Text style={[styles.userDate, { color: t('#9CA3AF', '#9CA3AF') }]}>
                                Membro desde {new Date(user?.created_at).toLocaleDateString('pt-BR')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Estatísticas */}
            <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: t('#FFFFFF', '#1F2937'), borderWidth: isDark ? 1 : 0, borderColor: isDark ? '#374151' : 'transparent' }]}>
                    <Text style={[styles.statValue, { color: t('#1F2937', '#F9FAFB') }]}>{stats.totalLists}</Text>
                    <Text style={[styles.statLabel, { color: t('#6B7280', '#9CA3AF') }]}>Listas Criadas</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: t('#FFFFFF', '#1F2937'), borderWidth: isDark ? 1 : 0, borderColor: isDark ? '#374151' : 'transparent' }]}>
                    <Text style={[styles.statValue, { color: '#27AE60' }]}>
                        R$ {stats.totalValue.toFixed(2)}
                    </Text>
                    <Text style={[styles.statLabel, { color: t('#6B7280', '#9CA3AF') }]}>Total Gasto</Text>
                </View>
            </View>

            <Modal
                visible={logoutModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.bottomModal,
                            { backgroundColor: t('#FFFFFF', '#1F2937') },
                        ]}
                    >
                        <View
                            style={[
                                styles.modalHeader,
                                { borderBottomColor: t('#E5E7EB', '#374151') },
                            ]}
                        >
                            <Text style={[styles.modalTitle, { color: t('#1F2937', '#F9FAFB') }]}>
                                Sair da conta
                            </Text>
                            <TouchableOpacity onPress={() => setLogoutModalVisible(false)}>
                                <Text style={{ color: t('#6B7280', '#9CA3AF'), fontSize: 18 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={[styles.modalText, { color: t('#6B7280', '#D1D5DB') }]}>
                                Tem certeza que deseja sair? Você precisará fazer login novamente para
                                acessar sua conta.
                            </Text>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => setLogoutModalVisible(false)}
                                    style={[styles.cancelButton, { backgroundColor: t('#F3F4F6', '#374151') }]}
                                >
                                    <Text style={[styles.cancelText, { color: t('#1F2937', '#F9FAFB') }]}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleLogout}
                                    style={[styles.confirmButton, { backgroundColor: '#EF4444' }]}
                                >
                                    <Text style={styles.confirmText}>Sair</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    title: { fontSize: 28, fontWeight: '800' },
    subtitle: { fontSize: 14, marginTop: 4 },
    themeButton: { padding: 8, borderRadius: 8 },
    logoutButton: { padding: 8, borderRadius: 8 },
    profileSection: { marginTop: 20, marginHorizontal: 20 },
    profileCard: {
        borderRadius: 20,
        padding: 20,
        elevation: 1,
    },
    avatarContainer: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
    userInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: '700' },
    userEmail: { fontSize: 14 },
    userDate: { fontSize: 12, marginTop: 4 },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 10,
    },
    statBox: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 18,
        marginHorizontal: 6,
        alignItems: 'center',
        elevation: 1
    },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 13, marginTop: 4 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 28,
        marginLeft: 20,
        marginBottom: 10,
    },
    listContainer: { paddingHorizontal: 20, paddingBottom: 120 },
    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 36, marginBottom: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 260,
    },
    //modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomModal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalContent: { padding: 20 },
    modalText: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelText: { fontSize: 16, fontWeight: '600' },
    confirmText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

});

