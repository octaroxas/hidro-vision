import { useTheme } from '@/hooks/useTheme';
import { Controller } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from "react-native";

type InputProps = {
    control: any,
    name: string,
    placeholder?: string,
    label?: string,
    error?: string | undefined
}
export default function Input({ control, name, placeholder, label, error }: InputProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);
    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: t('#374151', '#D1D5DB') }]}>{label}</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: t('#F9FAFB', '#111827'),
                                borderColor: t('#D1D5DB', '#374151'),
                                color: t('#1F2937', '#F9FAFB'),
                            },
                        ]}
                        placeholder={placeholder}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                    />
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
            )}
        />
    );
}
const styles = StyleSheet.create({
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#f87171',
        backgroundColor: '#ffe4e6',
        color: '#b91c1c'
    },
    container: {
        display: 'flex',
        flexDirection: 'column'
    },
    errorText: {
        color: '#b91c1c',
        marginTop: 4,
        fontSize: 12
    }
});