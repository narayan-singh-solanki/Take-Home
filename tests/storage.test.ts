import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, isCartItem } from '../src/storage/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);



describe('Storage & Versioned Persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('safely parses empty storage and returns fallback arrays', async () => {
    const cart = await storage.getCart();
    const searches = await storage.getRecentSearches();
    const usedFirst100 = await storage.hasUsedFirst100();

    expect(cart).toEqual([]);
    expect(searches).toEqual([]);
    expect(usedFirst100).toBe(false);
  });

  it('saves and restores cart items in versioned envelope', async () => {
    await storage.setCart([{ medicineId: 'm1', quantity: 2 }]);
    const restored = await storage.getCart();
    expect(restored).toEqual([{ medicineId: 'm1', quantity: 2 }]);

    // verify raw stored envelope has version 1
    const raw = await AsyncStorage.getItem('@plazza/cart');
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.data).toEqual([{ medicineId: 'm1', quantity: 2 }]);
  });

  it('defends against corrupt JSON or invalid shapes without crashing', async () => {
    // Inject corrupt JSON string
    await AsyncStorage.setItem('@plazza/cart', 'CORRUPT_NOT_JSON{{{');
    const restoredCorruptJson = await storage.getCart();
    expect(restoredCorruptJson).toEqual([]);

    // Inject valid JSON with corrupted schema
    await AsyncStorage.setItem(
      '@plazza/cart',
      JSON.stringify({ version: 1, data: [{ invalidField: 123 }] }),
    );
    const restoredInvalidSchema = await storage.getCart();
    expect(restoredInvalidSchema).toEqual([]);
  });

  it('limits recent searches to maximum 5 items', async () => {
    const searchList = ['dolo', 'crocin', 'pan', 'allegra', 'calpol', 'aug'];
    await storage.setRecentSearches(searchList);
    const saved = await storage.getRecentSearches();
    expect(saved).toHaveLength(5);
    expect(saved).toEqual(['dolo', 'crocin', 'pan', 'allegra', 'calpol']);
  });

  it('validates isCartItem type guard correctly', () => {
    expect(isCartItem({ medicineId: 'm1', quantity: 2 })).toBe(true);
    expect(isCartItem({ medicineId: 123, quantity: 2 })).toBe(false);
    expect(isCartItem({ medicineId: 'm1', quantity: -1 })).toBe(false);
    expect(isCartItem(null)).toBe(false);
    expect(isCartItem('string')).toBe(false);
  });
});
