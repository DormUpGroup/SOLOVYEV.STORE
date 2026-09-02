"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import { useRegisterPromo } from "@/components/providers/RegisterPromoProvider";
import { applyFirstOrderDiscount } from "@/lib/first-order-discount";
import { formatPrice } from "@/lib/products";

export function GuestDiscountLink({
  className = "",
  price,
  symbol = "₪",
}: {
  className?: string;
  price?: number;
  symbol?: string;
}) {
  const { dict } = useI18n();
  const { showPriceOffer } = useRegisterPromo();
  if (!showPriceOffer) return null;

  const sale = typeof price === "number" && price > 0 ? applyFirstOrderDiscount(price) : null;

  return (
    <Link
      href="/register"
      className={`guest-discount-link ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <span>{dict.registerPromo.priceOffer}</span>
      {sale && sale.discountAmount > 0 ? (
        <span className="guest-discount-price">{formatPrice(sale.total, symbol)}</span>
      ) : null}
    </Link>
  );
}
