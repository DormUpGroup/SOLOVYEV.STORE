"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FaqModal } from "@/components/modals/FaqModal";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import {
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";

function SuccessBody() {
  const params = useSearchParams();
  const { dict } = useI18n();
  const { clearCart } = useCart();
  const copy = dict.checkout;
  const ref = params.get("ref") || "";
  const [status, setStatus] = useState<"checking" | "paid" | "pending">("checking");
  const cleared = useRef(false);

  useEffect(() => {
    if (!ref) {
      setStatus("pending");
      return;
    }
    let cancelled = false;
    const confirm = async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderRef: ref }),
        });
        if (cancelled) return;
        if (response.ok) {
          if (!cleared.current) {
            clearCart();
            cleared.current = true;
          }
          setStatus("paid");
          return;
        }
        if (response.status !== 202) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!cancelled) {
        if (!cleared.current) {
          clearCart();
          cleared.current = true;
        }
        setStatus("pending");
      }
    };
    void confirm().catch(() => {
      if (!cancelled) setStatus("pending");
    });
    return () => {
      cancelled = true;
    };
  }, [clearCart, ref]);

  return (
    <main className="account-page checkout-page">
      <div className="account-page-header">
        <p className="account-eyebrow">SOLOVYEV STORE</p>
        <h1>{status === "checking" ? copy.confirming : copy.successTitle}</h1>
        <p className="account-muted">
          {status === "checking"
            ? copy.redirecting
            : copy.successBody.replace("{ref}", ref || "—")}
        </p>
        {status !== "checking" ? (
          <Link href="/account" className="btn-primary">{copy.viewOrders}</Link>
        ) : null}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <Suspense>
        <SuccessBody />
      </Suspense>
      <MinimalFooter />
      <CartDrawer />
      <QuickViewModal />
      <FaqModal />
      <SellTradeModal />
      <ToastNotification />
    </>
  );
}
