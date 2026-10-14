import type { CartItem, Medicine } from "../../types/models";
/** Limits a cart quantity to the valid range defined by the catalog item. */
export function toValidQuantity(quantity: number, medicine: Medicine): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(medicine.maxQty, Math.max(1, Math.trunc(quantity)));
}
export function updateCartItemQuantity(
  item: CartItem,
  medicine: Medicine,
  quantity: number,
): CartItem {
  return { ...item, quantity: toValidQuantity(quantity, medicine) };
}
