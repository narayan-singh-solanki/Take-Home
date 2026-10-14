import { toValidQuantity, updateCartItemQuantity } from '../src/domain/cart/cartQuantity';
import type { CartItem, Medicine } from '../src/types/models';

const medicine: Medicine = {
  id: 'example',
  name: 'Example medicine',
  salt: 'Example salt',
  price: 100,
  maxQty: 3,
  rx: false,
};

describe('Cart Quantity Domain Rules', () => {
  describe('toValidQuantity', () => {
    it('keeps quantities inside the catalog limit', () => {
      expect(toValidQuantity(2, medicine)).toBe(2);
      expect(toValidQuantity(10, medicine)).toBe(3); // capped at maxQty
      expect(toValidQuantity(0, medicine)).toBe(1); // floor is 1
    });

    it('handles non-finite or negative numbers gracefully', () => {
      expect(toValidQuantity(NaN, medicine)).toBe(1);
      expect(toValidQuantity(-5, medicine)).toBe(1);
    });

    it('truncates floating quantities', () => {
      expect(toValidQuantity(2.7, medicine)).toBe(2);
    });
  });

  describe('updateCartItemQuantity', () => {
    it('updates quantity while obeying maxQty cap', () => {
      const item: CartItem = { medicineId: 'example', quantity: 1 };
      const updated = updateCartItemQuantity(item, medicine, 5);
      expect(updated.quantity).toBe(3);
    });
  });
});
