import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setItem<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    await AsyncStorage.setItem(key, json);
}

export async function getItem<T>(key: string): Promise<T | null> {
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;
    try {
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

export async function removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
}
