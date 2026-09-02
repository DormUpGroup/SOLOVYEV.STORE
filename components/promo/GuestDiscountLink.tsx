"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import { useRegisterPromo } from "@/components/providers/RegisterPromoProvider";

export function GuestDiscountLink({ className = "" }: { className?: string }) {
  const { dict } = useI18n();
  const { showPriceOffer } = useRegisterPromo();
  if (!showPriceOffer) return null;

  return (
    <Link
      href="/register"
      className={`guest-discount-link ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      {dict.registerPromo.priceOffer}
    </Link>
  );
}
