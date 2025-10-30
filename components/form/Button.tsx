import { ReactNode } from "react"
import { ActivityIndicator, GestureResponderEvent, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native"

type ButtonProps = {
    title?: string,
    onPress?: (event: GestureResponderEvent) => void,
    variant?: 'default' | 'outline' | 'destructive',
    size?: 'md' | `sm` | `lg`,
    disabled?: boolean,
    loading?: boolean,
    children?: ReactNode,
    style?: StyleProp<ViewStyle>,
    textStyle?: StyleProp<TextStyle>,
    [rest: string]: any
}

export default function ButtonP({ title, onPress, variant = 'default', size = 'md', disabled = false, loading = false, children, style, textStyle, ...rest }: ButtonProps) {

    const buttonStyles = [
        styles.base,
        styles[variant],
        styles[size],
        disabled ? styles.disabled : null,
        style,
    ]

    const textStyles = [
        styles.textBase,
        variant === 'outline' ? styles.textOutline : styles.textDefault
    ]

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color='#ffffff' />
            ) :
                <Text style={textStyles}>{children ?? title}</Text>
            }
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    base: {
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    default: {
        backgroundColor: '#111827',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    outline: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    destructive: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    disabled: {
        opacity: 0.5
    },
    sm: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6
    },
    md: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    lg: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10
    },
    textBase: {
        fontSize: 14,
        fontWeight: '500'
    },
    textDefault: {
        color: '#fff'
    },
    textOutline: {
        color: '#000'
    }
})