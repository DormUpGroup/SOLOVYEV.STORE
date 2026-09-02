"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FIRST_ORDER_DISCOUNT_PERCENT } from "@/lib/first-order-discount";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  isRegisterPromoHiddenPath,
  useRegisterPromo,
} from "@/components/providers/RegisterPromoProvider";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const REGISTER_PROMO_DELAY_MS = 3000;

export function RegisterPromoModal() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { dict } = useI18n();
  const copy = dict.registerPromo;
  const { dismissed, dismiss } = useRegisterPromo();
  const [delayElapsed, setDelayElapsed] = useState(false);

  const onAdminPage =
    typeof document !== "undefined" && Boolean(document.querySelector(".admin-cms"));
  const eligible =
    !loading && !user && !dismissed && !isRegisterPromoHiddenPath(pathname) && !onAdminPage;
  const open = eligible && delayElapsed;

  useEffect(() => {
    if (!eligible) {
      setDelayElapsed(false);
      return;
    }
    const timer = window.setTimeout(() => setDelayElapsed(true), REGISTER_PROMO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, open]);

  if (!open) return null;

  return (
    <div className="modal open" id="register-promo-modal" role="dialog" aria-modal="true" aria-labelledby="register-promo-title">
      <div className="modal-backdrop" onClick={dismiss} aria-hidden="true" />
      <div className="modal-content register-promo-content">
        <button
          type="button"
          className="close-modal-btn"
          onClick={dismiss}
          aria-label={copy.close}
        >
          ×
        </button>
        <p className="register-promo-percent">{FIRST_ORDER_DISCOUNT_PERCENT}%</p>
        <h2 id="register-promo-title">{copy.title}</h2>
        <p className="register-promo-text">{copy.body}</p>
        <Link
          href="/register"
          className="btn-primary register-promo-cta"
          onClick={dismiss}
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
