import api from '@/api/Axios';
import { useTheme } from '@/hooks/useTheme';
import { router } from '@/router/Router';
import { Droplets, MapPin, SearchX, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

  const renderItem = ({ item }: { item: WaterSource }) => {
    // Usando o placeholder caso a foto não exista
    const imageUri = item.photo_url ?? 'https://conceitos.com/wp-content/uploads/ecologia/manancial.jpg';

    // Tratamento seguro para as coordenadas
    const hasCoordinates = item.coordinates && item.coordinates.length > 0;
    const locationText = hasCoordinates
      ? `${Number(item.coordinates.latitude).toFixed(4)}, ${Number(item.coordinates.longitude).toFixed(4)}`
      : 'Coordenadas não informadas';

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
        {/* Capa do Card (Imagem) */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

          {/* Badge flutuante em cima da imagem */}
          <View style={[styles.floatingBadge, { backgroundColor: t('rgba(255,255,255,0.9)', 'rgba(31,41,55,0.9)') }]}>
            <Droplets size={12} color={t('#2F80ED', '#60A5FA')} style={{ marginRight: 4 }} />
            <Text style={[styles.floatingBadgeText, { color: t('#2F80ED', '#60A5FA') }]}>
              {item.water_class?.water_class ?? 'Indefinida'}
            </Text>
          </View>
        </View>

        {/* Corpo do card */}
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

          {/* Footer do Card */}
          <View style={styles.infoFooter}>
            <View style={styles.infoRow}>
              <MapPin size={14} color={t('#6B7280', '#9CA3AF')} />
              <Text style={[styles.infoText, { color: t('#6B7280', '#9CA3AF') }]} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
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
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t('#F9FAFB', '#111827') }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: t('#F9FAFB', '#111827') }]}>
          <View>
            <Text style={[styles.title, { color: t('#111827', '#F9FAFB') }]}>HidroVision</Text>
            <Text style={[styles.subtitle, { color: t('#6B7280', '#9CA3AF') }]}>Mananciais registrados</Text>
          </View>
        </View>

        {/* Loading, Error ou Lista */}
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
            renderItem={renderItem}
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
  emptyText: { fontSize: 16, fontWeight: '500' },

  // Card Styles
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden', // Importante para a imagem não vazar das bordas arredondadas
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#E5E7EB', // Fundo caso a imagem demore a carregar
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