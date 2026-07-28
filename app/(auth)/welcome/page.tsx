"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/account/AuthCard";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";
import {
  buildAuthQuery,
  isCheckoutIntent,
  safeAuthNext,
} from "@/lib/customer-auth";
import { trackBeginCheckout } from "@/lib/analytics";
import { getProductById } from "@/lib/products";

function WelcomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { dict } = useI18n();
  const copy = dict.account;
  const { products } = useStore();
  const { cart, clearCart, openCart } = useCart();
  const checkout = isCheckoutIntent(params.get("checkout"));
  const next = params.get("next");
  const authQuery = buildAuthQuery({ next, checkout });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const product = getProductById(products, item.id);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0),
    [cart, products],
  );

  useEffect(() => {
    fetch("/api/account")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace(`/login${authQuery}`);
          return;
        }
        const body = await response.json() as {
          profile?: { display_name?: string | null };
          error?: string;
        };
        if (!response.ok) throw new Error(body.error || "Could not load account");
        const displayName = body.profile?.display_name?.trim();
        if (!displayName) {
          router.replace(`/onboarding${authQuery}`);
          return;
        }
        setName(displayName);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : copy.configError));
  }, [authQuery, copy.configError, router]);

  const continueCheckout = async () => {
    if (cart.length === 0) {
      openCart();
      router.replace(safeAuthNext(next, "/"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      trackBeginCheckout(subtotal, cart.length);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await response.json() as { whatsappUrl?: string; error?: string };
      if (response.status === 401) {
        router.replace(`/login${buildAuthQuery({ next, checkout: true })}`);
        return;
      }
      if (!response.ok || !data.whatsappUrl) throw new Error(data.error || "Checkout failed");
      clearCart();
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      router.replace("/account");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title={name ? copy.welcomeTitle.replace("{name}", name) : copy.welcomeFallbackTitle}
      description={checkout ? copy.welcomeCheckoutHelp : copy.welcomeHelp}
    >
      <div className="account-auth-result">
        {error ? <p className="account-error" role="alert">{error}</p> : null}
        {checkout ? (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !name}
            onClick={() => void continueCheckout()}
          >
            {busy ? copy.wait : copy.continueCheckout}
          </button>
        ) : null}
        <button
          type="button"
          className={checkout ? "btn-secondary" : "btn-primary"}
          onClick={() => router.replace(checkout ? safeAuthNext(next, "/") : "/account")}
        >
          {checkout ? copy.backToStore : copy.goToAccount}
        </button>
      </div>
    </AuthCard>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeContent />
    </Suspense>
  );
}
