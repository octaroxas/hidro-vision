import PublicOnlyGate from '@/components/PublicOnlyGate';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function SignUp() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        setIsLoading(true);
        setError('');

        try {

        } catch (err: any) {
            console.error('Erro ao cadastrar:', err);
            setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PublicOnlyGate>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: t('#F9FAFB', '#111827') }]}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.inner}>
                        {/* Título principal */}
                        <View style={styles.header}>
                            <View
                                style={[
                                    styles.iconCircle,
                                    { backgroundColor: t('#2F80ED15', '#2F80ED20') },
                                ]}
                            >
                                <ShoppingBag size={40} color={t('#2F80ED', '#60A5FA')} />
                            </View>
                            <Text style={[styles.appTitle, { color: t('#1F2937', '#F9FAFB') }]}>
                                TáNaLista
                            </Text>
                            <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>
                                Organize suas compras com praticidade
                            </Text>
                        </View>

                        {/* Card de cadastro */}
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: t('#FFFFFF', '#1F2937'),
                                    borderColor: isDark ? '#2E3440' : '#E5E7EB',
                                    shadowColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)',
                                    elevation: isDark ? 0 : 2,
                                },
                            ]}
                        >
                            <Text style={[styles.cardTitle, { color: t('#1F2937', '#F9FAFB') }]}>
                                Cadastre-se
                            </Text>

                            {error ? (
                                <Text
                                    style={[
                                        styles.errorText,
                                        {
                                            backgroundColor: t('#FEE2E2', '#7F1D1D20'),
                                            color: t('#EF4444', '#F87171'),
                                        },
                                    ]}
                                >
                                    {error}
                                </Text>
                            ) : null}

                            {/* Campo de E-mail */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>
                                    E-mail
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: t('#F9FAFB', '#111827'),
                                            borderColor: t('#D1D5DB', '#374151'),
                                            color: t('#1F2937', '#F9FAFB'),
                                        },
                                    ]}
                                    placeholder="seu@email.com"
                                    placeholderTextColor={t('#9CA3AF', '#6B7280')}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Campo de Senha */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>
                                    Senha
                                </Text>
                                <View
                                    style={[
                                        styles.passwordContainer,
                                        {
                                            backgroundColor: t('#F9FAFB', '#111827'),
                                            borderColor: t('#D1D5DB', '#374151'),
                                        },
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.passwordInput, { color: t('#1F2937', '#F9FAFB') }]}
                                        placeholder="••••••••"
                                        placeholderTextColor={t('#9CA3AF', '#6B7280')}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeButton}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} color={t('#6B7280', '#9CA3AF')} />
                                        ) : (
                                            <Eye size={20} color={t('#6B7280', '#9CA3AF')} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Botão de cadastro */}
                            <TouchableOpacity
                                onPress={handleSignUp}
                                disabled={isLoading}
                                style={[
                                    styles.loginButton,
                                    { backgroundColor: t('#2F80ED', '#2563EB'), opacity: isLoading ? 0.8 : 1 },
                                ]}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Cadastrar</Text>
                                )}
                            </TouchableOpacity>

                            {/* Link para login */}
                            <View style={styles.footerText}>
                                <Text style={{ color: t('#6B7280', '#9CA3AF') }}>
                                    Já tem uma conta?{' '}
                                </Text>
                                <TouchableOpacity onPress={() => router.push('/login')}>
                                    <Text style={{ color: t('#2F80ED', '#60A5FA'), fontWeight: '600' }}>
                                        Fazer login
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </PublicOnlyGate>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 6,
    },
    inner: { padding: 24 },
    card: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        marginHorizontal: 8,
        marginVertical: 8,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        fontWeight: '600',
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
    },
    passwordInput: { flex: 1, padding: 14, fontSize: 16 },
    eyeButton: { padding: 14 },
    loginButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    footerText: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});