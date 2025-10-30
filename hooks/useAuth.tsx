import { authResponse, credentials } from "@/@types/types";
import api from "@/api/Axios";
import { AuthContext } from '@/hooks/AuthContext';
import { router } from "@/router/Router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, useContext, useEffect, useState } from "react";

export const AuthProvider = ({ children }: { children: ReactNode }) => {

    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<string>();

    // useEffect(() => {
    //     setLoading(true)
    //     const getToken = async () => {
    //         const authToken = await AsyncStorage.getItem("token");
    //         const user = await AsyncStorage.getItem("user");
    //         if (authToken) {
    //             setToken(authToken);
    //             api.defaults.headers.common["Authorization"] = authToken;
    //         } else {
    //             router.push('/login')
    //         }
    //         if (user) {
    //             setUser(user);
    //         }
    //         setLoading(false);
    //     };
    //     getToken();
    // }, []);

    useEffect(() => {
        let isMounted = true;
        const getToken = async () => {
            try {
                setLoading(true);

                const [authToken, storedUser] = await Promise.all([
                    AsyncStorage.getItem('token'),
                    AsyncStorage.getItem('user'),
                ]);

                if (!isMounted) return;

                if (authToken) {
                    setToken(authToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
                } else {
                    router.replace('/login');
                    return;
                }

                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch {
                        console.warn('Erro ao parsear usuário armazenado');
                        await AsyncStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Erro ao recuperar token ou usuário:', error);
                router.replace('/login');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getToken();

        return () => {
            isMounted = false;
        };
    }, []);

    const getTokenAsyncStorage = async () => {
        // return token;
    }

    const login = async (data: credentials) => {
        setLoading(true);

        try {
            const res = await api.post<authResponse>("/auth", data);

            const { token, user } = res.data.data;

            if (!token || !user) {
                throw new Error("Resposta inválida do servidor.");
            }

            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setToken(token);

            try {
                await Promise.all([
                    AsyncStorage.setItem("token", `Bearer ${token}`),
                    AsyncStorage.setItem("user", JSON.stringify(user)),
                ]);
            } catch (error) {
                alert("Não foi possível salvar os dados localmente.");
                console.error("Erro ao salvar no AsyncStorage:", error);
            }

            router.replace("/(tabs)");
        } catch (error: any) {
            console.error("Erro no login:", error);
            alert(
                "Erro ao fazer login. Verifique suas credenciais e tente novamente. " + { error }
            );
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await AsyncStorage.removeItem("token");
            setToken(null);
            api.defaults.headers.common["Authorization"] = "";
            router.replace("/login");
        } catch (error) {
            console.error(error);
            alert("Erro ao fazer logout!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!token,
                token,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('o hook useAuth só pode ser usado dentro de um AauthProvider!')
    }
    return context;
}