import { createBill } from '../billing/billing';
import type { BillBreakdown } from '../../types/models';

export interface CouponEvaluation {
  valid: boolean;
  message?: string;
  discount: number;
  freeDelivery: boolean;
}

export interface CouponRuleContext {
  itemTotal: number;
  first100Used: boolean;
}

export type CouponRuleHandler = (ctx: CouponRuleContext) => CouponEvaluation;

export interface CouponDefinition {
  code: string;
  description: string;
  evaluate: CouponRuleHandler;
}

export const couponRules: Record<string, CouponDefinition> = {
  FLAT50: {
    code: 'FLAT50',
    description: '₹50 off on orders of ₹300 or more',
    evaluate: ({ itemTotal }) =>
      itemTotal >= 300
        ? { valid: true, discount: 50, freeDelivery: false }
        : { valid: false, discount: 0, freeDelivery: false, message: 'FLAT50 requires a minimum item total of ₹300.' },
  },
  SAVE10: {
    code: 'SAVE10',
    description: '10% off up to ₹100',
    evaluate: ({ itemTotal }) =>
      itemTotal > 0
        ? { valid: true, discount: Math.min(Math.round(itemTotal * 0.1), 100), freeDelivery: false }
        : { valid: false, discount: 0, freeDelivery: false, message: 'Add medicines before applying SAVE10.' },
  },
  FREEDEL: {
    code: 'FREEDEL',
    description: 'Free delivery',
    evaluate: ({ itemTotal }) =>
      itemTotal > 0
        ? { valid: true, discount: 0, freeDelivery: true }
        : { valid: false, discount: 0, freeDelivery: false, message: 'Add medicines before applying FREEDEL.' },
  },
  FIRST100: {
    code: 'FIRST100',
    description: '₹100 off on first order of ₹200 or more',
    evaluate: ({ itemTotal, first100Used }) => {
      if (first100Used) {
        return { valid: false, discount: 0, freeDelivery: false, message: 'FIRST100 has already been used.' };
      }
      return itemTotal >= 200
        ? { valid: true, discount: 100, freeDelivery: false }
        : { valid: false, discount: 0, freeDelivery: false, message: 'FIRST100 requires a minimum item total of ₹200.' };
    },
  },
};

/** Pluggable registry: allows registering new coupons without changing cart/billing */
export function registerCoupon(definition: CouponDefinition) {
  couponRules[definition.code] = definition;
}

export function evaluateCoupon(
  code: string,
  itemTotal: number,
  first100Used: boolean,
): CouponEvaluation {
  const rule = couponRules[code.trim().toUpperCase()];
  if (!rule) {
    return {
      valid: false,
      discount: 0,
      freeDelivery: false,
      message: `Coupon "${code}" is not available.`,
    };
  }
  return rule.evaluate({ itemTotal, first100Used });
}

export function billWithCoupon(
  itemTotal: number,
  code: string | null,
  first100Used: boolean,
): BillBreakdown {
  const coupon = code ? evaluateCoupon(code, itemTotal, first100Used) : undefined;
  return createBill(
    itemTotal,
    coupon?.valid ? coupon.discount : 0,
    coupon?.valid ? coupon.freeDelivery : false,
  );
}

