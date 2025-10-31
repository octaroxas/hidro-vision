import api from "@/api/Axios";
import Input from "@/components/form/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import MapView, { LatLng, MapPressEvent, Marker, MarkerDragStartEndEvent, Polygon, PROVIDER_GOOGLE } from "react-native-maps";
// import { WebViewMessageEvent } from 'react-native-webview';
import { z } from "zod";

import { FormWaterSource, WaterClass, WaterSource, WaterSourceType } from "@/@types/types";
import ButtonP from "@/components/form/Button";
import { router } from "@/router/Router";
import { isAxiosError } from "axios";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const INITIAL_REGION = {
    latitude: -2.430070,
    longitude: -54.715307,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

// type CreatedBy = {
//     id: number,
//     name: string
// }

// type WaterSource = {
//     id: number,
//     name: string,
//     description: string,
//     water_source_type: WaterSourceType,
//     created_by: CreatedBy,
//     coordinates: LatLng[],
// }

// type FormWaterSource = {
//     name: string;
//     description?: string | null;
//     water_source_type_id: number;
//     created_by: number;
//     coordinates?: LatLng[]
// };

// type WaterSourceType = {
//     id: number,
//     name: string,
//     deleted_at: string,
//     created_at: string,
//     updated_at: string
// }
// type WaterClass = {
//     id: number,
//     water_class: string,
//     description: string,
//     deleted_at: string,
//     created_at: string,
//     updated_at: string
// }

const coordinatesSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
})

const schema = z.object({
    name: z.string({ required_error: 'O nome do manancial é obrigatório!' }).nonempty('O nome do manancial é obrigatório!'),
    description: z.string().optional().nullable(),
    water_source_type_id: z.number({ required_error: 'O tipo de manancial é obrigatório!' }),
    water_class_id: z.number({ required_error: 'A classe é obrigatória!' }),
    created_by: z.number(),
})

export default function CreateWaterSourceScreen() {
    const [loading, setLoading] = useState<boolean>(false);
    const { control, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            water_source_type_id: undefined,
            created_by: 1,
            water_class_id: undefined,
            description: null,
        }
    })
    const [waterSourceTypes, setWaterSourceTypes] = useState<WaterSourceType[]>([]);
    const [waterClasses, setWaterClasses] = useState<WaterClass[]>([]);
    const [mapCoordinates, setMapCoordinates] = useState<LatLng[]>([]);
    const [waterSources, setWaterSources] = useState<WaterSource[]>();

    function getPolygonCenter(coordinates: LatLng[]): LatLng {
        const latSum = coordinates.reduce((sum, coord) => sum + coord.latitude, 0);
        const lngSum = coordinates.reduce((sum, coord) => sum + coord.longitude, 0);
        return {
            latitude: latSum / coordinates.length,
            longitude: lngSum / coordinates.length,
        };
    }
    // const onMessage = (event: WebViewMessageEvent) => {
    //     try {
    //         const data = JSON.parse(event.nativeEvent.data)
    //         if (data.latitude && data.longitude) {
    //             setMapCoordinates((prevCoord) => [...prevCoord, { latitude: data.latitude, longitude: data.longitude }])
    //         }
    //     } catch (error) {
    //         console.log('erro ao obter os dados do mapa!', error)
    //     }
    // }

    const onMapPress = (event: MapPressEvent) => {
        const { coordinate } = event.nativeEvent;
        const newCoord = { latitude: coordinate.latitude, longitude: coordinate.longitude }
        const updatedCoords = [...mapCoordinates, newCoord]
        setMapCoordinates(updatedCoords)
    }

    const onDragEnd = (event: MarkerDragStartEndEvent, index: number) => {
        const { coordinate } = event.nativeEvent;
        setMapCoordinates((prevMarkers: LatLng[]) => {
            const updatedMarkers = [...prevMarkers];
            updatedMarkers[index] = coordinate;
            return updatedMarkers;
        });
    }

    const sanitazeCoord = useCallback((coord: number) => {
        let [num, dig] = coord.toString().split('.')
        dig = dig.slice(0, 8);
        return parseFloat(num + '.' + dig)
    }, [])

    useEffect(() => {
        async function getWaterSources() {
            try {
                const [waterSourceTypesRes, waterClassesRes, waterSourcesRes] = await Promise.all([
                    api.get<{ data: WaterSourceType[] }>('/water-sources-types'),
                    api.get<{ data: WaterClass[] }>('/water-classes'),
                    api.get<{ data: WaterSource[] }>('/water-sources'),
                ])
                const waterSourcesFromAPI = waterSourcesRes.data.data.map((item: WaterSource) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    water_source_type: item.water_source_type,
                    created_by: item.created_by,
                    coordinates: item.coordinates.map((coord: LatLng) => ({
                        latitude: Number(coord.latitude),
                        longitude: Number(coord.longitude),
                    }))
                }));
                setWaterSources(waterSourcesFromAPI)
                setWaterSourceTypes(waterSourceTypesRes.data.data)
                setWaterClasses(waterClassesRes.data.data)
            } catch (error) {
                console.error('Erro ao buscar os dados:', error);
            }
        }
        getWaterSources();
    }, []);

    const onSubmit = async (data: FormWaterSource) => {
        console.log(mapCoordinates)
        if (mapCoordinates.length < 3) {
            Alert.alert('Atenção', 'Marque no mínimo 3 pontos no mapa para que possa ser possível delimitar a área do manancial!')
            return
        }

        const payload = {
            ...data,
            coordinates: mapCoordinates.map((coordnate) => ({
                latitude: sanitazeCoord(coordnate.latitude),
                longitude: sanitazeCoord(coordnate.longitude),
            }))
        }
        console.log(payload)
        setLoading(true)

        try {
            const res = await api.post(
                '/water-sources/store',
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );
            alert(`${JSON.stringify(res.data.data.name)} cadastrado!`);
            router.replace(`/(tabs)`);
        } catch (error) {
            console.error(error);
            if (isAxiosError(error) && error.response) {
                console.log(error.response.data)
                alert(error.response.data.message)
            } else {
                alert(`Erro ao cadastrar o manancial ${error}`)
            }
        } finally {
            setLoading(false)
        }

    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Cadastrando manancial...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            <Text style={styles.title}>Registro de manancial</Text>
            <ScrollView>

                <Input error={errors?.name?.message} control={control} label="Nome" name="name" placeholder="Informe o nome" />

                <Input error={errors?.description?.message} control={control} label="Descrição" name="description" placeholder="Informe a descrição" />

                <Controller
                    control={control}
                    rules={{ required: true }}
                    name="water_source_type_id"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                            <Text style={{ fontWeight: 'bold' }}>Tipo de manancial</Text>
                            <TouchableOpacity
                                style={[styles.pickerContainer, errors.water_source_type_id ? styles.inputError : null]}
                            >
                                <Picker
                                    style={[styles.picker, errors.water_source_type_id ? styles.inputError : null]}
                                    onValueChange={(itemValue, itemIndex) =>
                                        onChange(Number(itemValue))
                                    }>
                                    <Picker.Item key='#09785' label='Selecione' value={null} />
                                    {waterSourceTypes.map((item) => (
                                        <Picker.Item key={item.created_at} label={item.name} value={item.id} />
                                    ))}
                                </Picker>
                            </TouchableOpacity>
                        </View>
                    )}
                />
                {errors.water_source_type_id && <Text style={styles.errorText}>{errors.water_source_type_id.message}</Text>}

                <Controller
                    control={control}
                    rules={{ required: true }}
                    name="water_class_id"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                            <Text style={{ fontWeight: 'bold' }}>Classe hídrica</Text>
                            <TouchableOpacity
                                style={[styles.pickerContainer, errors.water_class_id ? styles.inputError : null]}
                            >
                                <Picker
                                    style={[styles.picker, errors.water_source_type_id ? styles.inputError : null]}
                                    onValueChange={(itemValue, itemIndex) =>
                                        onChange(Number(itemValue))
                                    }>
                                    <Picker.Item key='#0978439' label='Selecione' value={null} />
                                    {waterClasses.map((item) => (
                                        <Picker.Item key={item.created_at} label={item.water_class} value={item.id} />
                                    ))}
                                </Picker>
                            </TouchableOpacity>
                        </View>
                    )}
                />
                {errors.water_class_id && <Text style={styles.errorText}>{errors.water_class_id.message}</Text>}

                <Text style={{ fontWeight: 'bold', marginVertical: 5 }}>Coordenadas do manancial</Text>
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={INITIAL_REGION}
                    onPress={onMapPress}
                    zoomControlEnabled
                    zoomEnabled
                    zoomTapEnabled
                >

                    {
                        waterSources?.map((marker: WaterSource) => (
                            <Polygon
                                key={marker.id}
                                coordinates={marker.coordinates}
                                strokeColor="#FF0000"
                                fillColor="rgba(255,0,0,0.3)"
                                strokeWidth={2}
                            />
                        ))
                    }
                    {
                        mapCoordinates.map((marker, index) => (
                            <Marker
                                key={index}
                                coordinate={marker}
                                title={`Coordenada ${index + 1}`}
                                description={`Latitude:${marker.latitude}, Longitude:${marker.longitude}`}
                                draggable
                                onDragEnd={e => onDragEnd(e, index)}
                            />
                        ))
                    }

                    {
                        mapCoordinates.length >= 3 && (
                            <Polygon
                                coordinates={mapCoordinates}
                                strokeColor="#FF0000"
                                fillColor="rgba(0, 89, 255, 0.3)"
                                strokeWidth={2}
                            />
                        )
                    }
                </MapView>
            </ScrollView>
            <View style={styles.buttonsContainer}>
                <ButtonP loading={false} disabled={false} size="md" title="Cadastrar" style={{ width: '70%' }} onPress={handleSubmit(onSubmit)} />
                <ButtonP loading={false} disabled={false} size="md" variant='outline' style={{ width: '30%' }} title="Salvar rascunho" onPress={() => { }} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 10
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        marginVertical: 20
    },
    input: {
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#4B5563',
        padding: 10,
        marginBottom: 12,
    },
    error: {
        color: 'red',
        marginBottom: 8,
    },
    map: {
        width: Dimensions.get('window').width - 20,
        height: Dimensions.get('screen').height - 500,
        marginBottom: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        // borderWidth: 1,
        // borderColor: '#ccc',
        // borderRadius: 8,
        // paddingHorizontal: 5,
        // backgroundColor: '#fff',
        // height: 40,
        width: '100%',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f1f1f1',
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        // alignItems: 'center',
        marginVertical: 5
    },
    picker: {
        color: '#333',
        // backgroundColor: '#fff',
        backfaceVisibility: 'hidden',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#4B5563',
    },
    inputError: {
        borderColor: '#f87171',
        backgroundColor: '#ffe4e6',
        color: '#b91c1c'
    },
    errorText: {
        color: '#b91c1c',
        marginTop: 4,
        fontSize: 12
    },
    buttonsContainer: {
        display: 'flex',
        gap: 5,
        width: '100%',
        flexDirection: 'row'
    }
});