import { WaterSource } from "@/@types/types";
import { router } from "@/router/Router";
import axios from "axios";
import { Droplets, Plus, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
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

  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    const loadWaterSources = async () => {
      try {
        const response = await axios.get(
          "https://api-mananciais.yuresamarone.shop/api/v1/water-sources"
        );

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
    const lightnessStroke = 40;
    const lightnessFill = 70;
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f172a" : "#f9fafb" }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={[styles.loadingText, { color: isDark ? "#e5e7eb" : "#374151" }]}>
            Carregando mananciais...
          </Text>
        </View>
      ) : (
        <>
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
            style={styles.floatingButton}
            onPress={() => router.push('/water_sources/create')}
            activeOpacity={0.85}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Modal de Detalhes */}
      <Modal
        visible={!!selectedSource}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSource(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? "#1e293b" : "#fff" }]}>
            <View style={styles.modalHeader}>
              <Droplets size={22} color="#0EA5E9" />
              <Text style={[styles.modalTitle, { color: isDark ? "#f1f5f9" : "#0f172a" }]}>
                {selectedSource?.name}
              </Text>
            </View>
            <Text style={[styles.modalDescription, { color: isDark ? "#cbd5e1" : "#475569" }]}>
              {selectedSource?.description || "Sem descrição disponível."}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setSelectedSource(null);
                router.push(`/water_sources/details?id=${selectedSource?.id}`);
              }}
            >
              <Text style={styles.modalButtonText}>Ver detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Criação (Bottom Sheet) */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.createModal, { backgroundColor: isDark ? "#1e293b" : "#fff" }]}>
            <View style={styles.createHeader}>
              <Text style={[styles.createTitle, { color: isDark ? "#f1f5f9" : "#0f172a" }]}>
                Registrar Manancial
              </Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <X size={22} color={isDark ? "#94a3b8" : "#475569"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Nome do manancial"
                placeholderTextColor="#9ca3af"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                style={[styles.input, { color: isDark ? "#f8fafc" : "#111827" }]}
              />
              <TextInput
                placeholder="Descrição"
                placeholderTextColor="#9ca3af"
                multiline
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                style={[styles.input, styles.textArea, { color: isDark ? "#f8fafc" : "#111827" }]}
              />
              <TextInput
                placeholder="Tipo (Ex: Nascente, Poço, Rio...)"
                placeholderTextColor="#9ca3af"
                value={form.water_source_type}
                onChangeText={(v) => setForm({ ...form, water_source_type: v })}
                style={[styles.input, { color: isDark ? "#f8fafc" : "#111827" }]}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  placeholder="Latitude"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                  value={form.latitude}
                  onChangeText={(v) => setForm({ ...form, latitude: v })}
                  style={[styles.input, { flex: 1, color: isDark ? "#f8fafc" : "#111827" }]}
                />
                <TextInput
                  placeholder="Longitude"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                  value={form.longitude}
                  onChangeText={(v) => setForm({ ...form, longitude: v })}
                  style={[styles.input, { flex: 1, color: isDark ? "#f8fafc" : "#111827" }]}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleCreateSource}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%", borderRadius: 16 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#0EA5E9",
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
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "95%",
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  modalDescription: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modalButton: {
    backgroundColor: "#0EA5E9",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  // Novo modal de criação
  createModal: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  createTitle: { fontSize: 18, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(148,163,184,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: "#0EA5E9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});

