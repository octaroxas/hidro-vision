// components/PublicOnlyGate.tsx (opcional)
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function PublicOnlyGate({ children }: { children: React.ReactNode }) {
    const { status } = useAuthGuard();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') router.replace('/(tabs)');
    }, [status]);

    if (status === 'loading') return null;
    return <>{children}</>;
}
