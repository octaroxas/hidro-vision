import { WaterSource } from "@/@types/types";
import api from "@/api/Axios";
import { useTheme } from "@/hooks/useTheme"; // <-- Importamos o seu hook de tema
import { router } from "@/router/Router";
import { StatusBar } from "expo-status-bar"; // <-- Importante para corrigir os ícones do topo
import { Droplets, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { LatLng, Marker, Polygon } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const INITIAL_REGION = {
  latitude: -2.43007,
  longitude: -54.715307,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapRoute() {
  // --- Sistema de Tema Unificado ---
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const t = (light: string, dark: string) => (isDark ? dark : light);

  const [waterSources, setWaterSources] = useState<WaterSource[]>();
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    water_source_type: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    const loadWaterSources = async () => {
      try {
        const response = await api.get("/water-sources");

        const formatted = response.data.data.map((item: WaterSource) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          water_source_type: item.water_source_type,
          created_by: item.created_by,
          coordinates: item.coordinates.map((coord: LatLng) => ({
            latitude: Number(coord.latitude),
            longitude: Number(coord.longitude),
          })),
        }));

        setWaterSources(formatted);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os mananciais.");
        console.error("Erro ao carregar mananciais:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWaterSources();
  }, []);

  function getPolygonCenter(coordinates: LatLng[]): LatLng {
    const latSum = coordinates.reduce((sum, c) => sum + c.latitude, 0);
    const lngSum = coordinates.reduce((sum, c) => sum + c.longitude, 0);
    return {
      latitude: latSum / coordinates.length,
      longitude: lngSum / coordinates.length,
    };
  }

  function getRandomHexColor(baseHue?: number) {
    const hue = baseHue ?? Math.floor(Math.random() * 360);
    const saturation = 70;
    const lightnessStroke = isDark ? 60 : 40; // Ajuste sutil para contraste no dark mode
    const lightnessFill = isDark ? 30 : 70;
    return {
      strokeColor: `hsl(${hue}, ${saturation}%, ${lightnessStroke}%)`,
      fillColor: `hsl(${hue}, ${saturation}%, ${lightnessFill}%)`,
    };
  }

  function handleCreateSource() {
    if (!form.name || !form.latitude || !form.longitude) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos obrigatórios.");
      return;
    }

    console.log("Novo manancial cadastrado:", form);

    setForm({
      name: "",
      description: "",
      water_source_type: "",
      latitude: "",
      longitude: "",
    });
    setIsCreateModalVisible(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t('#F9FAFB', '#111827') }]} edges={['top']}>

      {/* Controla a visibilidade de Hora, Bateria, Wi-Fi no topo da tela */}
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={t('#F9FAFB', '#111827')} />

      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: t('#F9FAFB', '#111827') }]}>
          <ActivityIndicator size="large" color={t('#2F80ED', '#60A5FA')} />
          <Text style={[styles.loadingText, { color: t('#6B7280', '#9CA3AF') }]}>
            Carregando o mapa de mananciais...
          </Text>
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          <MapView
            provider="google"
            style={styles.map}
            initialRegion={INITIAL_REGION}
            showsUserLocation
            showsMyLocationButton
          >
            {waterSources?.map((w) => {
              const { strokeColor, fillColor } = getRandomHexColor();
              return (
                <React.Fragment key={w.id}>
                  <Polygon
                    coordinates={w.coordinates}
                    strokeColor={strokeColor}
                    fillColor={fillColor}
                    strokeWidth={2}
                  />
                  <Marker
                    title={w.name}
                    coordinate={getPolygonCenter(w.coordinates)}
                    onPress={() => setSelectedSource(w)}
                  />
                </React.Fragment>
              );
            })}
          </MapView>

          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: t('#2F80ED', '#3B82F6') }]}
            onPress={() => router.push('/water_sources/create')}
            activeOpacity={0.85}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={!!selectedSource}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSource(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: t('#FFFFFF', '#1E293B') }]}>
            <View style={styles.modalHeader}>
              <Droplets size={22} color={t('#2F80ED', '#60A5FA')} />
              <Text style={[styles.modalTitle, { color: t('#111827', '#F9FAFB') }]}>
                {selectedSource?.name}
              </Text>
            </View>
            <Text style={[styles.modalDescription, { color: t('#4B5563', '#9CA3AF') }]}>
              {selectedSource?.description || "Sem descrição disponível."}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: t('#2F80ED', '#3B82F6') }]}
              onPress={() => {
                const sourceId = selectedSource?.id;
                setSelectedSource(null);
                router.push(`/water_sources/details?id=${sourceId}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Ver detalhes completos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrapper: { flex: 1 },
  map: { flex: 1 },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '500' },

  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "92%",
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalDescription: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Modal de criação
  createModal: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  createTitle: { fontSize: 20, fontWeight: "700" },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});