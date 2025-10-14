// Servicio de almacenamiento seguro para tokens
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@kaia:access_token';
const REFRESH_TOKEN_KEY = '@kaia:refresh_token';
const USER_KEY = '@kaia:user';

class SecureStorage {
  // Tokens
  async saveAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async saveRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  // Usuario
  async saveUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  }

  // Limpiar todo
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  }

  // Guardar cualquier dato
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(`@kaia:${key}`, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(`@kaia:${key}`);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(`@kaia:${key}`);
  }

  // Guardar objetos
  async setObject(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(`@kaia:${key}`, JSON.stringify(value));
  }

  async getObject<T>(key: string): Promise<T | null> {
    const data = await AsyncStorage.getItem(`@kaia:${key}`);
    return data ? JSON.parse(data) : null;
  }
}

export const secureStorage = new SecureStorage();
export default secureStorage;
