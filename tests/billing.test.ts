import { createBill, getItemTotal, toCartLines } from '../src/domain/billing/billing';
import type { CartItem, Medicine } from '../src/types/models';

const mockCatalog: Medicine[] = [
  { id: 'm1', name: 'Dolo 650', salt: 'Paracetamol', price: 30, maxQty: 5, rx: false },
  { id: 'm3', name: 'Azithral 500', salt: 'Azithromycin', price: 120, maxQty: 2, rx: true },
  { id: 'm8', name: 'Augmentin 625', salt: 'Amoxicillin', price: 200, maxQty: 2, rx: true },
];

describe('Billing Logic', () => {
  describe('toCartLines & getItemTotal', () => {
    it('converts cart items to lines and respects catalog maxQty', () => {
      const cartItems: CartItem[] = [
        { medicineId: 'm1', quantity: 3 },
        { medicineId: 'm3', quantity: 99 }, // exceeds maxQty (2)
      ];
      const lines = toCartLines(cartItems, mockCatalog);
      expect(lines).toHaveLength(2);
      expect(lines[0].quantity).toBe(3);
      expect(lines[1].quantity).toBe(2); // capped at maxQty
    });

    it('calculates accurate item total', () => {
      const cartItems: CartItem[] = [
        { medicineId: 'm1', quantity: 2 }, // 30 * 2 = 60
        { medicineId: 'm8', quantity: 2 }, // 200 * 2 = 400
      ];
      const lines = toCartLines(cartItems, mockCatalog);
      expect(getItemTotal(lines)).toBe(460);
    });
  });

  describe('Delivery Fee Thresholds', () => {
    it('charges flat ₹40 delivery fee when itemTotal is strictly below ₹499', () => {
      const bill = createBill(498);
      expect(bill.deliveryFee).toBe(40);
      expect(bill.grandTotal).toBe(498 + 40);
    });

    it('charges ₹0 delivery fee when itemTotal is exactly ₹499', () => {
      const bill = createBill(499);
      expect(bill.deliveryFee).toBe(0);
      expect(bill.grandTotal).toBe(499);
    });

    it('charges ₹0 delivery fee when itemTotal is above ₹499', () => {
      const bill = createBill(600);
      expect(bill.deliveryFee).toBe(0);
      expect(bill.grandTotal).toBe(600);
    });

    it('charges ₹0 delivery fee when cart is empty (itemTotal = 0)', () => {
      const bill = createBill(0);
      expect(bill.deliveryFee).toBe(0);
      expect(bill.grandTotal).toBe(0);
    });

    it('waives delivery fee when freeDelivery flag is true even if below ₹499', () => {
      const bill = createBill(250, 0, true);
      expect(bill.deliveryFee).toBe(0);
      expect(bill.grandTotal).toBe(250);
    });
  });

  describe('Discount Constraints', () => {
    it('ensures discount never exceeds itemTotal', () => {
      const bill = createBill(50, 100); // requested ₹100 discount on ₹50 cart
      expect(bill.discount).toBe(50);
      expect(bill.grandTotal).toBe(0 + 40); // 50 - 50 + 40 delivery
    });

    it('ignores negative discounts', () => {
      const bill = createBill(300, -50);
      expect(bill.discount).toBe(0);
      expect(bill.grandTotal).toBe(340);
    });
  });
});

