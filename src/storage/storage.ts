import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '../types/models';

export const STORAGE_VERSION = 1;

interface VersionedEnvelope<T> {
  version: number;
  data: T;
}

const keys = {
  cart: '@plazza/cart',
  recentSearches: '@plazza/recent-searches',
  first100Used: '@plazza/coupons/FIRST100-used',
} as const;

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

export function isCartItem(item: unknown): item is CartItem {
  if (!isObject(item)) return false;
  return (
    typeof item.medicineId === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0
  );
}

function parseVersioned<T>(raw: string | null, validator: (data: unknown) => data is T, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (isObject(parsed) && 'version' in parsed && 'data' in parsed) {
      if (typeof parsed.version === 'number' && validator(parsed.data)) {
        return parsed.data;
      }
    }
    // Backward compatibility if raw array was saved
    if (validator(parsed)) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function serializeVersioned<T>(data: T): string {
  const envelope: VersionedEnvelope<T> = {
    version: STORAGE_VERSION,
    data,
  };
  return JSON.stringify(envelope);
}

export const storage = {
  async getCart(): Promise<CartItem[]> {
    try {
      const raw = await AsyncStorage.getItem(keys.cart);
      return parseVersioned(
        raw,
        (data): data is CartItem[] => Array.isArray(data) && data.every(isCartItem),
        [],
      );
    } catch {
      return [];
    }
  },

  async setCart(cart: CartItem[]): Promise<void> {
    const valid = cart.filter(isCartItem);
    await AsyncStorage.setItem(keys.cart, serializeVersioned(valid));
  },

  async getRecentSearches(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(keys.recentSearches);
      return parseVersioned(
        raw,
        (data): data is string[] =>
          Array.isArray(data) && data.every((s) => typeof s === 'string' && s.trim().length > 0),
        [],
      );
    } catch {
      return [];
    }
  },

  async setRecentSearches(searches: string[]): Promise<void> {
    const valid = searches
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 5);
    await AsyncStorage.setItem(keys.recentSearches, serializeVersioned(valid));
  },

  async hasUsedFirst100(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(keys.first100Used)) === 'true';
    } catch {
      return false;
    }
  },

  async setFirst100Used(): Promise<void> {
    await AsyncStorage.setItem(keys.first100Used, 'true');
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([keys.cart, keys.recentSearches, keys.first100Used]);
    } catch {
      // safe fallback
    }
  },
};
