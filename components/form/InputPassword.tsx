import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type InputProps = {
    control: any,
    name: string,
    placeholder?: string,
    label?: string,
    error?: string | undefined
}
export default function InputPassword({ control, name, placeholder, label, error }: InputProps) {
    const [showPassword, setShowPassword] = useState(true);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }
    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>{label}</Text>
                    <View style={[
                        styles.passwordContainer,
                        {
                            backgroundColor: t('#F9FAFB', '#111827'),
                            borderColor: t('#D1D5DB', '#374151'),
                        },
                    ]}>
                        <TextInput
                            secureTextEntry={showPassword}
                            style={[styles.passwordInput, { color: t('#1F2937', '#F9FAFB') }]}
                            placeholderTextColor={t('#9CA3AF', '#6B7280')}
                            placeholder={placeholder}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                        <TouchableOpacity style={styles.eyeButton} onPress={togglePasswordVisibility}>
                            {showPassword ? (
                                <Feather
                                    name="eye-off"
                                    size={20}
                                    style={[error ? styles.errorIcon : null]}
                                    color={t('#9CA3AF', '#6B7280')}
                                />
                            ) : (
                                <Feather
                                    name="eye"
                                    size={20}
                                    style={[error ? styles.errorIcon : null]}
                                    color={t('#9CA3AF', '#6B7280')}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                    {error && <Text style={styles.errorText}>{error}</Text>}

                </View>
            )}
        />
    );
}
const styles = StyleSheet.create({
    container: {
        borderRadius: 5,
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
    },
    inputTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f1f1f1',
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        padding: 10,
        width: '90%',
        height: 40,
        borderRadius: 6,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#000'
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
    },
    passwordInput: { flex: 1, padding: 14, fontSize: 16 },
    eyeButton: { padding: 14 },
    toggle: {
        width: '10%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputError: {
        borderColor: '#f87171',
        backgroundColor: '#ffe4e6',
        color: '#b91c1c'
    },
    errorText: {
        color: '#b91c1c',
        marginTop: 4,
        fontSize: 12
    },
    errorIcon: {
        color: '#b91c1c',
    }
});