






// import ButtonP from '@/components/form/Button';
// import { useTheme } from '@/hooks/useTheme';
// // import MonitoringList from '@/components/MonitoringList';
// // import { Colors } from '@/constants/Colors';
// // import { useAppTheme } from '@/hooks/useAppTheme';
// import { router } from '@/router/Router';
// import axios from 'axios';
// import { useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { ActivityIndicator, Alert, Dimensions, Image, Linking, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
// import MapView, { LatLng, Marker, Polygon } from 'react-native-maps';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const INITIAL_REGION = {
//     latitude: -2.430070,
//     longitude: -54.715307,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
// };

// type WaterSourceType = {
//     id: number,
//     name: string,
// }
// type CreatedBy = {
//     id: number,
//     name: string
// }

// type WaterClass = {
//     id: number,
//     water_class: string
// }

// type WaterSource = {
//     id: number,
//     name: string,
//     description: string,
//     water_source_type: WaterSourceType,
//     water_class: WaterClass,
//     created_by: CreatedBy,
//     coordinates: LatLng[],
//     deleted_at: string | null;
//     created_at: string;
//     updated_at: string;
// }

// export default function DetailsWaterSourceScreen() {
//     const { theme } = useTheme();

//     const { id } = useLocalSearchParams();
//     const [waterSource, setWaterSource] = useState<WaterSource>();
//     const [tab, setTab] = useState<'info' | 'map' | 'history'>('info');

//     const [loading, setLoading] = useState<boolean>(true);

//     const scheme = useColorScheme();
//     const isDark = scheme === 'dark';

//     const styles = StyleSheet.create({
//         image: {
//             width: '100%',
//             height: 300,
//         },
//         container: {
//             padding: 16,
//         },
//         card: {
//             backgroundColor: isDark ? '#1f2937' : '#ffffff',
//             borderRadius: 12,
//             marginBottom: 12,
//             elevation: 1,
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.1,
//             shadowRadius: 4,
//         },
//         titleContainer: {
//             display: 'flex',
//             flexDirection: 'row',
//             // color: Colors[theme].text,
//         },
//         infoLabel: {
//             // color: Colors[theme].text,
//             fontWeight: 'bold',
//             fontSize: 16,
//         },
//         title: {
//             fontSize: 18,
//             fontWeight: 'bold',
//             // color: Colors[theme].text,
//             marginBottom: 4,
//         },
//         infoContainer: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//         },
//         description: {
//             // color: Colors[theme].text,
//             marginBottom: 8,
//         },
//         info: {
//             fontSize: 16,
//             // color: Colors[theme].text,
//             marginBottom: 2,
//         },
//         label: {
//             fontWeight: 'bold',
//         },
//         center: {
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//         },
//         mapContainer: {
//             // marginVertical: 20,
//         },
//         map: {
//             height: Dimensions.get('screen').height / 2,
//         },
//         base: {
//             borderRadius: 8,
//             alignItems: 'center',
//             justifyContent: 'center',
//         },
//         default: {
//             // backgroundColor: Colors[theme].background,
//             paddingVertical: 10,
//             paddingHorizontal: 16,
//         },
//         outline: {
//             borderWidth: 1,
//             borderColor: isDark ? '#374151' : '#d1d5db',
//             // backgroundColor: Colors[theme].background,
//             paddingVertical: 10,
//             paddingHorizontal: 16,
//         },
//         destructive: {
//             backgroundColor: isDark ? '#b91c1c' : '#fff',
//             paddingVertical: 10,
//             paddingHorizontal: 16,
//         },
//         disabled: {
//             opacity: 0.5,
//         },
//         sm: {
//             paddingVertical: 6,
//             paddingHorizontal: 12,
//             borderRadius: 6,
//         },
//         md: {
//             paddingVertical: 10,
//             paddingHorizontal: 16,
//         },
//         lg: {
//             paddingVertical: 14,
//             paddingHorizontal: 20,
//             borderRadius: 10,
//         },
//         textBase: {
//             fontSize: 14,
//             fontWeight: '500',
//         },
//         textDefault: {
//             // color: Colors[theme].text,
//         },
//         textOutline: {
//             color: isDark ? '#f9fafb' : '#000',
//         },
//         tab: {
//             borderRadius: 10,
//             alignItems: 'center',
//             justifyContent: 'center',
//             paddingVertical: 10,
//             paddingHorizontal: 16,
//             marginBottom: 5
//         },
//         tabTextActive: {
//             color: isDark ? '#fff' : '#111827',
//         },
//         tabTextInactive: {
//             color: '#a9a9a9ff',
//         },
//         tabActive: {
//             backgroundColor: isDark ? '#111827' : '#f3f4f6',
//         },
//         tabInactive: {
//             backgroundColor: theme === 'dark' ? 'black' : '#f1f1f1f1',
//         }
//     });
//     useEffect(() => {
//         async function getWaterSources() {
//             try {
//                 const res = await axios.get<{
//                     data: WaterSource;
//                 }>(
//                     `https://api-mananciais.yuresamarone.shop/api/v1/water-sources/${id}`
//                 );
//                 setWaterSource({
//                     id: res.data.data.id,
//                     name: res.data.data.name,
//                     description: res.data.data.description,
//                     water_source_type: res.data.data.water_source_type,
//                     water_class: res.data.data.water_class,
//                     created_by: res.data.data.created_by,
//                     coordinates: res.data.data.coordinates.map((coord: LatLng) => ({
//                         latitude: Number(coord.latitude),
//                         longitude: Number(coord.longitude),
//                     })),
//                     deleted_at: res.data.data.deleted_at,
//                     created_at: res.data.data.created_at,
//                     updated_at: res.data.data.updated_at
//                 });
//             } catch (error) {
//                 console.error('Erro ao buscar mananciais:', error);
//             } finally {
//                 setLoading(false);
//             }
//         }

//         getWaterSources();
//     }, []);

//     if (loading) {
//         return (
//             <View style={styles.center}>
//                 <ActivityIndicator size="large" />
//                 <Text>Carregando mananciais...</Text>
//             </View>
//         );
//     }

//     const destroy = async () => {
//         try {
//             const res = await axios.delete(
//                 `https://api-mananciais.yuresamarone.shop/api/v1/water-sources/${id}`
//             );
//             alert('Manancial excluído');
//             router.replace('/(tabs)')
//         } catch (error) {
//             console.error('Erro ao buscar mananciais:', error);
//         } finally {
//             setLoading(false);
//         }
//     }
//     function getPolygonCenter(coordinates: LatLng[]): LatLng {
//         const latSum = coordinates.reduce((sum, coord) => sum + coord.latitude, 0);
//         const lngSum = coordinates.reduce((sum, coord) => sum + coord.longitude, 0);
//         return {
//             latitude: latSum / coordinates.length,
//             longitude: lngSum / coordinates.length,
//         };
//     }

//     const openMaps = async (lat: any, lng: any) => {
//         const url = `https://maps.google.com/maps?q=${lat},${lng}`;
//         const supported = await Linking.canOpenURL(url);
//         if (supported) {
//             await Linking.openURL(url);
//         } else {
//             console.warn('Cannot open URL:', url);
//         }
//     };


//     return (
//         <SafeAreaView>
//             <Image
//                 source={{ uri: "https://conceitos.com/wp-content/uploads/ecologia/manancial.jpg" }}
//                 style={styles.image}
//                 resizeMode="cover"
//             />

//             <View style={{ display: 'flex', gap: 5, flexDirection: 'row', paddingTop: 10, paddingHorizontal: 10 }}>
//                 <TouchableOpacity
//                     style={[styles.tab, tab === 'info' ? styles.tabActive : styles.tabInactive]}
//                     onPress={() => setTab('info')}
//                 >
//                     <Text style={[tab === 'info' ? styles.tabTextActive : styles.tabTextInactive]}>Informações</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     style={[styles.tab, tab === 'map' ? styles.tabActive : styles.tabInactive]}
//                     onPress={() => setTab('map')}
//                 >
//                     <Text style={[tab === 'map' ? styles.tabTextActive : styles.tabTextInactive]}>Mapa</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     style={[styles.tab, tab === 'history' ? styles.tabActive : styles.tabInactive]}
//                     onPress={() => setTab('history')}
//                 >
//                     <Text style={[tab === 'history' ? styles.tabTextActive : styles.tabTextInactive]}>Histórico</Text>
//                 </TouchableOpacity>
//             </View>

//             <View style={{ marginHorizontal: 10, borderTopLeftRadius: 0, borderTopRightRadius: 10, borderBottomRightRadius: 10, borderBottomLeftRadius: 10, }}>

//                 {tab === 'info' && (
//                     <View style={{ paddingHorizontal: 16 }}>
//                         {waterSource && (
//                             <View style={{ paddingVertical: 10 }}>
//                                 <View style={styles.titleContainer}>
//                                     <Text style={styles.title}>{waterSource.name}</Text>
//                                 </View>
//                                 <View style={styles.infoContainer}>
//                                     <Text style={styles.infoLabel}>Tipo</Text>
//                                     <Text style={styles.info}>{waterSource.water_source_type.name}</Text>
//                                 </View>

//                                 <View style={styles.infoContainer}>
//                                     <Text style={styles.infoLabel}>Classe</Text>
//                                     <Text style={styles.info}>Classe {waterSource.water_class.water_class}</Text>
//                                 </View>

//                                 <View style={styles.infoContainer}>
//                                     <Text style={styles.infoLabel}>Cadastrado por</Text>
//                                     <Text style={styles.info}>{waterSource.created_by.name}</Text>
//                                 </View>

//                                 <View style={styles.infoContainer}>
//                                     <Text style={styles.infoLabel}>Descrição</Text>
//                                     <Text style={styles.info}>{waterSource.description ?? null}</Text>
//                                 </View>
//                             </View>
//                         )}

//                         <View style={{ display: 'flex', gap: 5, flexDirection: 'row-reverse', padding: 5 }}>
//                             <ButtonP
//                                 size='sm'
//                                 loading={false}
//                                 disabled={false}
//                                 title='Abrir com Maps'
//                                 onPress={() => openMaps(waterSource?.coordinates[0].latitude, waterSource?.coordinates[0].longitude)}
//                             />
//                             <ButtonP
//                                 disabled={false}
//                                 loading={false}
//                                 size='sm'
//                                 title='Excluir'
//                                 onPress={() => Alert.alert(
//                                     'Exclusão de manancial!',
//                                     'Deseja realmente excluí-lo?',
//                                     [
//                                         { text: 'Cancelar', style: 'cancel' },
//                                         {
//                                             text: 'Excluir',
//                                             onPress: () => {
//                                                 destroy()
//                                                 Alert.alert('Exclusão de manancial', 'O manancial foi excluído!')
//                                             },
//                                             style: 'destructive'
//                                         }
//                                     ],
//                                     { cancelable: true }
//                                 )}
//                             />
//                             {/* <ButtonP
//                                 disabled={false}
//                                 loading={false}
//                                 size='sm'
//                                 title='Editar'
//                                 onPress={() => Alert.alert('Edição de manancial')}
//                             /> */}
//                         </View>
//                     </View>
//                 )}

//                 {tab === 'history' && (
//                     <View style={{ padding: 10 }}>
//                         {/* <MonitoringList waterSourceId={id} /> */}
//                     </View>
//                 )}

//                 {tab === 'map' && (
//                     <View style={styles.mapContainer}>
//                         <MapView
//                             style={styles.map}
//                             initialRegion={INITIAL_REGION}>
//                             {
//                                 waterSource?.coordinates &&
//                                 <Polygon
//                                     key={waterSource?.created_at}
//                                     coordinates={waterSource?.coordinates}
//                                     strokeColor="#FF0000"
//                                     fillColor="rgba(255,0,0,0.3)"
//                                     strokeWidth={2}
//                                 />
//                             }

//                             {
//                                 waterSource && (
//                                     <Marker
//                                         title={`${waterSource.name}`}
//                                         coordinate={getPolygonCenter(waterSource.coordinates)}
//                                     >
//                                     </Marker>
//                                 )
//                             }
//                         </MapView>
//                     </View>
//                 )}
//             </View>
//         </SafeAreaView >
//     );
// }