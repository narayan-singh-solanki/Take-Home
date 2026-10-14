import { billWithCoupon, evaluateCoupon, registerCoupon } from '../src/domain/coupons/coupons';

describe('Coupon Rules & Promotion Engine', () => {
  describe('FLAT50 Rule', () => {
    it('applies ₹50 discount when item total is at least ₹300', () => {
      const evaluation = evaluateCoupon('FLAT50', 300, false);
      expect(evaluation.valid).toBe(true);
      expect(evaluation.discount).toBe(50);
      expect(evaluation.freeDelivery).toBe(false);
    });

    it('rejects FLAT50 when item total is strictly below ₹300', () => {
      const evaluation = evaluateCoupon('FLAT50', 299, false);
      expect(evaluation.valid).toBe(false);
      expect(evaluation.discount).toBe(0);
      expect(evaluation.message).toBeDefined();
    });
  });

  describe('SAVE10 Rule & Cap', () => {
    it('applies 10% discount on cart total', () => {
      const evaluation = evaluateCoupon('SAVE10', 400, false);
      expect(evaluation.valid).toBe(true);
      expect(evaluation.discount).toBe(40);
    });

    it('strictly caps SAVE10 discount at ₹100', () => {
      const evaluation = evaluateCoupon('SAVE10', 1500, false);
      expect(evaluation.valid).toBe(true);
      expect(evaluation.discount).toBe(100); // capped at 100 instead of 150
    });

    it('rejects SAVE10 on empty cart', () => {
      const evaluation = evaluateCoupon('SAVE10', 0, false);
      expect(evaluation.valid).toBe(false);
      expect(evaluation.discount).toBe(0);
    });
  });

  describe('FREEDEL Rule', () => {
    it('waives the delivery fee entirely', () => {
      const evaluation = evaluateCoupon('FREEDEL', 200, false);
      expect(evaluation.valid).toBe(true);
      expect(evaluation.freeDelivery).toBe(true);

      const bill = billWithCoupon(200, 'FREEDEL', false);
      expect(bill.deliveryFee).toBe(0);
      expect(bill.grandTotal).toBe(200);
    });

    it('rejects FREEDEL when cart is empty', () => {
      const evaluation = evaluateCoupon('FREEDEL', 0, false);
      expect(evaluation.valid).toBe(false);
    });
  });

  describe('FIRST100 Rule & One-Time Use', () => {
    it('applies ₹100 discount when item total is at least ₹200 and not previously used', () => {
      const evaluation = evaluateCoupon('FIRST100', 250, false);
      expect(evaluation.valid).toBe(true);
      expect(evaluation.discount).toBe(100);
    });

    it('rejects FIRST100 when item total is below ₹200', () => {
      const evaluation = evaluateCoupon('FIRST100', 199, false);
      expect(evaluation.valid).toBe(false);
      expect(evaluation.message).toContain('₹200');
    });

    it('strictly rejects FIRST100 if user has already used it once', () => {
      const evaluation = evaluateCoupon('FIRST100', 500, true);
      expect(evaluation.valid).toBe(false);
      expect(evaluation.message).toContain('already been used');
    });
  });

  describe('Coupon Invalidation & Auto-Removal simulation', () => {
    it('detects coupon invalidation when cart item total drops', () => {
      // User initially had ₹350 in cart, applied FLAT50
      let evalResult = evaluateCoupon('FLAT50', 350, false);
      expect(evalResult.valid).toBe(true);

      // User removes an item, cart total drops to ₹250
      evalResult = evaluateCoupon('FLAT50', 250, false);
      expect(evalResult.valid).toBe(false);
      expect(evalResult.message).toBeDefined();
    });
  });

  describe('Pluggable Coupon Extension (Bonus Requirement)', () => {
    it('allows registering and evaluating a new coupon without altering billing code', () => {
      registerCoupon({
        code: 'SUPER20',
        description: '20% off up to ₹200 for orders above ₹500',
        evaluate: ({ itemTotal }) => {
          if (itemTotal < 500) {
            return { valid: false, discount: 0, freeDelivery: false, message: 'SUPER20 requires ₹500 minimum' };
          }
          return { valid: true, discount: Math.min(Math.round(itemTotal * 0.2), 200), freeDelivery: false };
        },
      });

      const invalidEval = evaluateCoupon('SUPER20', 400, false);
      expect(invalidEval.valid).toBe(false);

      const validEval = evaluateCoupon('SUPER20', 600, false);
      expect(validEval.valid).toBe(true);
      expect(validEval.discount).toBe(120);

      const bill = billWithCoupon(600, 'SUPER20', false);
      expect(bill.discount).toBe(120);
      expect(bill.grandTotal).toBe(480);
    });
  });
});

