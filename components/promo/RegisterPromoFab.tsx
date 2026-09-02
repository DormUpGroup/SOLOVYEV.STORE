"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useRegisterPromo } from "@/components/providers/RegisterPromoProvider";
import { useUI } from "@/components/providers/UIProvider";

export function RegisterPromoFab() {
  const pathname = usePathname();
  const { dict } = useI18n();
  const { showFab } = useRegisterPromo();
  const { isOpen: cartOpen } = useCart();
  const { activeModal } = useUI();
  const onProductPage = pathname.startsWith("/product/");
  const visible = showFab && !cartOpen && !activeModal && !onProductPage;

  useEffect(() => {
    document.body.classList.toggle("has-register-promo-fab", visible);
    return () => document.body.classList.remove("has-register-promo-fab");
  }, [visible]);

  if (!visible) return null;

  return (
    <Link href="/register" className="register-promo-fab">
      <span className="register-promo-fab-full">{dict.registerPromo.fab}</span>
      <span className="register-promo-fab-short">{dict.registerPromo.fabShort}</span>
    </Link>
  );
}
