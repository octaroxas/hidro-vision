// components/AuthGate.tsx
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTheme } from '@/hooks/useTheme';
import type { RelativePathString } from 'expo-router';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

type Props = { children: React.ReactNode; redirectIfUnauthedTo?: RelativePathString; };

export default function AuthGate({ children, redirectIfUnauthedTo = '/login' as RelativePathString }: Props) {
    const { status } = useAuthGuard();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        if (status === 'unauthenticated') {
            // replace evita "voltar" para a tela protegida
            router.replace(redirectIfUnauthedTo);
        }
    }, [status]);

    if (status === 'loading') {
        return (
            <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2F80ED'} />
            </View>
        );
    }

    // authenticated
    return <>{children}</>;
}
