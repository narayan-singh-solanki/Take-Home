import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { catalog } from '../../data/catalog/catalog';
import { toCartLines, getItemTotal, type CartLine } from '../../domain/billing/billing';
import { billWithCoupon, evaluateCoupon } from '../../domain/coupons/coupons';
import { storage } from '../../storage/storage';
import type { BillBreakdown, CartItem, CouponCode, Medicine } from '../../types/models';

type AddResult = 'added' | 'incremented' | 'limit';
interface CartContextValue {
  hydrated: boolean;
  cartItems: CartItem[];
  lines: CartLine[];
  itemCount: number;
  bill: BillBreakdown;
  coupon: CouponCode | null;
  notice: string | null;
  addMedicine: (medicine: Medicine) => AddResult;
  decreaseMedicine: (medicine: Medicine) => void;
  removeMedicine: (medicineId: string) => void;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;
  placeOrder: () => void;
  clearNotice: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as { medicineId?: unknown; quantity?: unknown };
  return typeof item.medicineId === 'string' && typeof item.quantity === 'number' && Number.isFinite(item.quantity);
}

export function CartProvider({ children }: PropsWithChildren) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponCode | null>(null);
  const [first100Used, setFirst100Used] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([storage.getCart(), storage.hasUsedFirst100()]).then(([savedCart, used]) => {
      if (!active) return;
      setCartItems(savedCart.filter(isCartItem));
      setFirst100Used(used);
      setHydrated(true);
    }).catch(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void storage.setCart(cartItems).catch(() => setNotice('Cart changes are available now but could not be saved.'));
  }, [cartItems, hydrated]);

  const lines = useMemo(() => toCartLines(cartItems, catalog), [cartItems]);
  const itemTotal = useMemo(() => getItemTotal(lines), [lines]);
  const bill = useMemo(() => billWithCoupon(itemTotal, coupon, first100Used), [coupon, first100Used, itemTotal]);
  const itemCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);

  const validateCouponFor = useCallback((nextItems: CartItem[]) => {
    if (!coupon) return;
    const nextTotal = getItemTotal(toCartLines(nextItems, catalog));
    const result = evaluateCoupon(coupon, nextTotal, first100Used);
    if (!result.valid) {
      setCoupon(null);
      setNotice(`${coupon} was removed. ${result.message ?? ''}`.trim());
    }
  }, [coupon, first100Used]);

  const updateCart = useCallback((nextItems: CartItem[]) => {
    validateCouponFor(nextItems);
    setCartItems(nextItems);
  }, [validateCouponFor]);

  const addMedicine = useCallback((medicine: Medicine): AddResult => {
    const existing = cartItems.find((item) => item.medicineId === medicine.id);
    if (existing && existing.quantity >= medicine.maxQty) {
      setNotice(`Maximum quantity is ${medicine.maxQty} for ${medicine.name}.`);
      return 'limit';
    }
    const next = existing
      ? cartItems.map((item) => item.medicineId === medicine.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cartItems, { medicineId: medicine.id, quantity: 1 }];
    updateCart(next);
    setNotice(existing ? `${medicine.name} quantity updated.` : `${medicine.name} added to your cart.`);
    return existing ? 'incremented' : 'added';
  }, [cartItems, updateCart]);

  const decreaseMedicine = useCallback((medicine: Medicine) => {
    const current = cartItems.find((item) => item.medicineId === medicine.id);
    if (!current) return;
    updateCart(current.quantity <= 1 ? cartItems.filter((item) => item.medicineId !== medicine.id) : cartItems.map((item) => item.medicineId === medicine.id ? { ...item, quantity: item.quantity - 1 } : item));
  }, [cartItems, updateCart]);

  const removeMedicine = useCallback((medicineId: string) => updateCart(cartItems.filter((item) => item.medicineId !== medicineId)), [cartItems, updateCart]);

  const applyCoupon = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase() as CouponCode;
    if (!code) { setNotice('Please enter a coupon code.'); return false; }
    const result = evaluateCoupon(code, itemTotal, first100Used);
    if (!result.valid) { setNotice(result.message ?? 'This coupon cannot be applied.'); return false; }
    setCoupon(code);
    setNotice(`${code} applied to your cart.`);
    return true;
  }, [first100Used, itemTotal]);

  const placeOrder = useCallback(() => {
    if (!cartItems.length) { setNotice('Add medicines before placing an order.'); return; }
    if (coupon === 'FIRST100') { setFirst100Used(true); void storage.setFirst100Used().catch(() => setNotice('Order placed, but FIRST100 usage could not be saved.')); }
    setCartItems([]); setCoupon(null); setNotice('Order placed. Your medicines are on their way.');
  }, [cartItems.length, coupon]);

  const value = useMemo<CartContextValue>(() => ({ hydrated, cartItems, lines, itemCount, bill, coupon, notice, addMedicine, decreaseMedicine, removeMedicine, applyCoupon, clearCoupon: () => setCoupon(null), placeOrder, clearNotice: () => setNotice(null) }), [addMedicine, applyCoupon, bill, cartItems, coupon, decreaseMedicine, hydrated, itemCount, lines, notice, placeOrder, removeMedicine]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used inside CartProvider.'); return context; }
