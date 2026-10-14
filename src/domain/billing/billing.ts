import type { BillBreakdown, CartItem, Medicine } from '../../types/models';

export interface CartLine { medicine: Medicine; quantity: number; }

export function toCartLines(cartItems: readonly CartItem[], catalog: readonly Medicine[]): CartLine[] {
  return cartItems.flatMap((item) => {
    const medicine = catalog.find((candidate) => candidate.id === item.medicineId);
    return medicine && item.quantity > 0 ? [{ medicine, quantity: Math.min(item.quantity, medicine.maxQty) }] : [];
  });
}

export function getItemTotal(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + line.medicine.price * line.quantity, 0);
}

export function createBill(itemTotal: number, discount = 0, freeDelivery = false): BillBreakdown {
  const deliveryFee = itemTotal > 0 && itemTotal < 499 && !freeDelivery ? 40 : 0;
  const safeDiscount = Math.min(Math.max(discount, 0), itemTotal);
  return { itemTotal, discount: safeDiscount, deliveryFee, grandTotal: itemTotal - safeDiscount + deliveryFee };
}
