import api from '@/api/Axios';
import WaterSourceCard from '@/components/water-source-card';
import { useTheme } from '@/hooks/useTheme';
import { SearchX } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Coordinate = {
  id: number;
  latitude: string;
  longitude: string;
};

type WaterSource = {
  id: number;
  name: string;
  description: string;
  water_source_type: { id: number; name: string };
  water_class: { id: number; water_class: string };
  created_by: { id: number; name: string; email: string };
  coordinates: Coordinate[];
  photo_url?: string; // Adicionado para prever a imagem no futuro
};

export default function HomeRoute() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const t = (light: string, dark: string) => (isDark ? dark : light);

  const [data, setData] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchMananciais = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/water-sources');
      const json = await response.data;

      if (json.status !== 'success' || !json.data) {
        throw new Error('Erro ao carregar dados');
      }

      setData(json.data);
    } catch (err: any) {
      console.error('Erro ao buscar mananciais:', err);
      setError('Não foi possível carregar os mananciais.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMananciais();
  }, [fetchMananciais]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMananciais();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]} edges={['top']}>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: t('#F9FAFB', '#111827') }]}>
          <View>
            <Text style={[styles.title, { color: t('#111827', '#F9FAFB') }]}>HidroVision</Text>
            <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>Mananciais registrados</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t('#2F80ED', '#60A5FA')} size="large" />
            <Text style={[styles.loadingText, { color: t('#6B7280', '#9CA3AF') }]}>
              Carregando mananciais...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: t('#EF4444', '#F87171') }]}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={{ marginTop: 12 }}>
              <Text style={{ color: t('#2F80ED', '#60A5FA'), fontWeight: '600' }}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIconCircle, { backgroundColor: t('#F3F4F6', '#1F2937') }]}>
              <SearchX size={32} color={t('#9CA3AF', '#6B7280')} />
            </View>
            <Text style={[styles.emptyText, { color: t('#4B5563', '#D1D5DB') }]}>
              Nenhum manancial encontrado.
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <WaterSourceCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[t('#2F80ED', '#60A5FA')]}
                tintColor={t('#2F80ED', '#60A5FA')}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4, fontWeight: '500' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },

  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '500' }
});