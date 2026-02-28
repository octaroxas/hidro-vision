import { useTheme } from '@/hooks/useTheme';
import { router } from '@/router/Router';
import { Droplets, User } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type WaterSource = {
    id: number;
    name: string;
    description: string;
    water_source_type: { id: number; name: string };
    water_class: { id: number; water_class: string };
    created_by: { id: number; name: string; email: string };
    photo_url?: string;
};

interface WaterSourceCardProps {
    item: WaterSource;
}

export default function WaterSourceCard({ item }: WaterSourceCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const t = (light: string, dark: string) => (isDark ? dark : light);

    const imageUri = item.photo_url ?? 'https://conceitos.com/wp-content/uploads/ecologia/manancial.jpg';

    return (
        <TouchableOpacity
            onPress={() => router.push(`/water_sources/details?id=${item.id}`)}
            activeOpacity={0.8}
            style={[
                styles.card,
                {
                    borderColor: t('#E5E7EB', '#374151'),
                    backgroundColor: t('#FFFFFF', '#1E293B'),
                    shadowColor: '#000',
                },
            ]}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

                <View style={[styles.floatingBadge, { backgroundColor: t('rgba(255,255,255,0.9)', 'rgba(31,41,55,0.9)') }]}>
                    <Droplets size={12} color={t('#2F80ED', '#60A5FA')} style={{ marginRight: 4 }} />
                    <Text style={[styles.floatingBadgeText, { color: t('#2F80ED', '#60A5FA') }]}>
                        {item.water_class?.water_class ?? 'Indefinida'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: t('#111827', '#F9FAFB') }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.type, { color: t('#6B7280', '#9CA3AF') }]}>
                        {item.water_source_type?.name ?? 'Não informado'}
                    </Text>
                </View>

                <Text style={[styles.description, { color: t('#4B5563', '#D1D5DB') }]} numberOfLines={2}>
                    {item.description || 'Nenhuma descrição detalhada foi fornecida para este manancial.'}
                </Text>

                <View style={[styles.divider, { backgroundColor: t('#F3F4F6', '#374151') }]} />

                <View style={styles.infoFooter}>
                    <View style={styles.infoRow}>
                        <User size={14} color={t('#6B7280', '#9CA3AF')} />
                        <Text style={[styles.infoText, { color: t('#6B7280', '#9CA3AF') }]} numberOfLines={1}>
                            {item.created_by?.name ?? 'Autor desconhecido'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
        backgroundColor: '#E5E7EB',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    floatingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    floatingBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    cardBody: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
    type: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
    description: { fontSize: 14, lineHeight: 22 },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 14,
    },
    infoFooter: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13, fontWeight: '500', flex: 1 },
});