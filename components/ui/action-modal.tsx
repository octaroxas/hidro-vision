import { useTheme } from '@/hooks/useTheme';
import { X } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ActionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function ActionModal({ visible, onClose, title, children }: ActionModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View
                    style={[
                        styles.modalContainer,
                        { backgroundColor: t('#FFFFFF', '#1F2937') },
                    ]}
                >
                    <View style={styles.modalNotchContainer}>
                        <View style={[styles.modalNotch, { backgroundColor: t('#E5E7EB', '#4B5563') }]} />
                    </View>

                    <View
                        style={[
                            styles.modalHeader,
                            { borderBottomColor: t('#E5E7EB', '#374151') },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: t('#1F2937', '#F9FAFB') }]}>
                            {title}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            activeOpacity={0.7}
                        >
                            <X size={24} color={t('#6B7280', '#9CA3AF')} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        {children}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    modalNotchContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    modalNotch: {
        width: 40,
        height: 5,
        borderRadius: 3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700'
    },
    closeButton: {
        padding: 4
    },
    modalContent: {
        padding: 24
    },
});