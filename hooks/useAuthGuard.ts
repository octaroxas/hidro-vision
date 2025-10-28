import { useState } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuthGuard() {
    const [status, setStatus] = useState<AuthStatus>('loading');

    // useEffect(() => {
    //     let mounted = true;
    //     (async () => {
    //         // const { data, error } = await supabase.auth.getSession();
    //         if (!mounted) return;

    //         if (error || !data.session) {
    //             setStatus('unauthenticated');
    //         } else {
    //             setStatus('authenticated');
    //         }
    //     })();
    // }, []);

    return { status };
}
