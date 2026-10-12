import type { CartItem } from "@/lib/types";

export function normalizeCheckoutItems(raw: unknown): CartItem[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) return null;
  const items = raw.map((item) => {
    const row = item as { id?: unknown; product_id?: unknown; size?: unknown };
    return {
      id: Number(row.id ?? row.product_id),
      product_id: Number(row.id ?? row.product_id),
      size: String(row.size ?? "").slice(0, 40),
      quantity: 1,
      qty: 1,
    };
  });
  if (items.some((item) => !Number.isInteger(item.id))) return null;
  return items;
}

export function israelPhoneE164(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return `972${digits}`;
}
