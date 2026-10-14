import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '../types/models';
const keys = { cart: '@plazza/cart', recentSearches: '@plazza/recent-searches', first100Used: '@plazza/coupons/FIRST100-used' } as const;
function parseJson<T>(value: string | null, fallback: T): T { if (value === null) return fallback; try { return JSON.parse(value) as T; } catch { return fallback; } }
export const storage = {
  async getCart(): Promise<CartItem[]> { return parseJson<CartItem[]>(await AsyncStorage.getItem(keys.cart), []); },
  async setCart(cart: CartItem[]): Promise<void> { await AsyncStorage.setItem(keys.cart, JSON.stringify(cart)); },
  async getRecentSearches(): Promise<string[]> { return parseJson<string[]>(await AsyncStorage.getItem(keys.recentSearches), []); },
  async setRecentSearches(searches: string[]): Promise<void> { await AsyncStorage.setItem(keys.recentSearches, JSON.stringify(searches)); },
  async hasUsedFirst100(): Promise<boolean> { return (await AsyncStorage.getItem(keys.first100Used)) === 'true'; },
  async setFirst100Used(): Promise<void> { await AsyncStorage.setItem(keys.first100Used, 'true'); },
};
