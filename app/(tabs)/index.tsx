import api from '@/api/Axios';
import { useTheme } from '@/hooks/useTheme';
import { Droplet, MapPin, RefreshCcw, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
};

export default function HomeScreen() {
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

  const renderItem = ({ item }: { item: WaterSource }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          borderColor: t('#E5E7EB', '#2E3440'),
          backgroundColor: t('#FFFFFF', '#1E293B'),
          shadowColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)',
        },
      ]}
    >
      {/* Cabeçalho */}
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: t('#2F80ED15', '#2F80ED25') },
          ]}
        >
          <Droplet size={26} color={t('#2F80ED', '#60A5FA')} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: t('#111827', '#F9FAFB') }]}>
            {item.name}
          </Text>
          <Text style={[styles.type, { color: t('#6B7280', '#9CA3AF') }]}>
            {item.water_source_type?.name ?? 'Tipo não informado'}
          </Text>
        </View>
      </View>

      {/* Descrição */}
      <Text
        style={[styles.description, { color: t('#374151', '#D1D5DB') }]}
        numberOfLines={3}
      >
        {item.description}
      </Text>

      {/* Infos adicionais */}
      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <MapPin size={15} color={t('#6B7280', '#9CA3AF')} />
          <Text style={[styles.infoText, { color: t('#6B7280', '#9CA3AF') }]}>
            {item.coordinates?.length
              ? `${item.coordinates[0].latitude}, ${item.coordinates[0].longitude}`
              : 'Sem coordenadas'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <User size={15} color={t('#6B7280', '#9CA3AF')} />
          <Text style={[styles.infoText, { color: t('#6B7280', '#9CA3AF') }]}>
            {item.created_by?.name ?? 'Autor desconhecido'}
          </Text>
        </View>
      </View>

      {/* Classe da água */}
      <View
        style={[
          styles.badge,
          { backgroundColor: t('#2F80ED10', '#2F80ED20'), borderColor: t('#2F80ED25', '#2F80ED30') },
        ]}
      >
        <Text style={[styles.badgeText, { color: t('#2F80ED', '#60A5FA') }]}>
          Classe: {item.water_class?.water_class ?? 'Indefinida'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: t('#F9FAFB', '#111827') }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t('#1F2937', '#F9FAFB') }]}>
          Mananciais
        </Text>
        <TouchableOpacity onPress={fetchMananciais}>
          <RefreshCcw size={22} color={t('#2F80ED', '#60A5FA')} />
        </TouchableOpacity>
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
          <Text style={[styles.errorText, { color: t('#EF4444', '#F87171') }]}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[t('#2F80ED', '#60A5FA')]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14 },
  errorText: { fontSize: 15, fontWeight: '600' },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  type: { fontSize: 13, marginTop: 2 },
  description: { fontSize: 14, lineHeight: 20, marginVertical: 6 },
  infoBlock: { marginTop: 8, gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
