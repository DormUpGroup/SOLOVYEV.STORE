"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { FIRST_ORDER_DISCOUNT_PERCENT } from "@/lib/first-order-discount";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";

const HIDDEN_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/welcome",
  "/account",
  "/auth/callback",
]);

function shouldHideOnPath(pathname: string): boolean {
  if (HIDDEN_PATHS.has(pathname) || pathname.startsWith("/account/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/admin-internal")) {
    return true;
  }
  return false;
}

export function RegisterPromoModal() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { dict } = useI18n();
  const copy = dict.registerPromo;
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const close = useCallback(() => {
    setDismissed(true);
    setOpen(false);
  }, []);

  useEffect(() => {
    const onAdminPage =
      typeof document !== "undefined" && Boolean(document.querySelector(".admin-cms"));
    if (loading || user || dismissed || shouldHideOnPath(pathname) || onAdminPage) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [dismissed, loading, pathname, user]);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  if (!open) return null;

  return (
    <div className="modal open" id="register-promo-modal" role="dialog" aria-modal="true" aria-labelledby="register-promo-title">
      <div className="modal-backdrop" onClick={close} aria-hidden="true" />
      <div className="modal-content register-promo-content">
        <button
          type="button"
          className="close-modal-btn"
          onClick={close}
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
          onClick={close}
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
