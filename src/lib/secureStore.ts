import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure key/value storage. Uses the OS keychain/keystore via expo-secure-store
 * on native. expo-secure-store is unavailable on web, so we fall back to
 * AsyncStorage (localStorage) there — web is dev/preview only, not a shipping
 * target for credentials.
 */
const isWeb = Platform.OS === 'web';

export async function secureGet(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function secureDelete(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
