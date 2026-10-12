import { FREE_SHIPPING_THRESHOLD } from "@/lib/first-order-discount";

export const SHIPPING_METHODS = ["pickup", "locker", "courier"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const LOCKER_SHIPPING_ILS = 25;
export const COURIER_SHIPPING_ILS = 50;

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return typeof value === "string" && (SHIPPING_METHODS as readonly string[]).includes(value);
}

export function shippingAmountFor(method: ShippingMethod, productSubtotal: number): number {
  if (method === "pickup") return 0;
  if (method === "locker") return LOCKER_SHIPPING_ILS;
  if (productSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return COURIER_SHIPPING_ILS;
}

export function orderChargeAmount(productSubtotal: number, shippingAmount: number): number {
  return Math.max(0, Number(productSubtotal) + Number(shippingAmount));
}
