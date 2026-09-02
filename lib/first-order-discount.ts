export const FIRST_ORDER_DISCOUNT_PERCENT = 15;
export const FREE_SHIPPING_THRESHOLD = 1000;

export type FirstOrderDiscount = {
  original: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
};

export function firstOrderDiscountAmount(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round(subtotal * (FIRST_ORDER_DISCOUNT_PERCENT / 100));
}

export function applyFirstOrderDiscount(subtotal: number): FirstOrderDiscount {
  const discountAmount = firstOrderDiscountAmount(subtotal);
  return {
    original: subtotal,
    discountPercent: discountAmount > 0 ? FIRST_ORDER_DISCOUNT_PERCENT : 0,
    discountAmount,
    total: Math.max(0, subtotal - discountAmount),
  };
}

export function qualifiesForFreeShipping(grossSubtotal: number): boolean {
  return grossSubtotal >= FREE_SHIPPING_THRESHOLD;
}
