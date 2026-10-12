"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { formatPrice, getProductById } from "@/lib/products";
import { productImageSrc } from "@/lib/product-image";
import { applyFirstOrderDiscount } from "@/lib/first-order-discount";
import {
  SHIPPING_METHODS,
  shippingAmountFor,
  orderChargeAmount,
  type ShippingMethod,
} from "@/lib/checkout/shipping";
import { trackBeginCheckout } from "@/lib/analytics";
import { useSearchParams } from "next/navigation";

export function CheckoutPageClient() {
  const params = useSearchParams();
  const { products, config } = useStore();
  const { cart, clearCart } = useCart();
  const { user, firstOrderDiscountEligible, consumeFirstOrderDiscount } = useAuth();
  const { dict } = useI18n();
  const copy = dict.checkout;
  const [shipping, setShipping] = useState<ShippingMethod>("pickup");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    params.get("cancel") === "1" ? copy.paymentFailed : "",
  );

  useEffect(() => {
    fetch("/api/account")
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json() as {
          profile?: { display_name?: string | null; phone?: string | null };
        };
        if (body.profile?.display_name) setFullName((current) => current || body.profile!.display_name || "");
        if (body.profile?.phone) setPhone((current) => current || body.profile!.phone || "");
      })
      .catch(() => undefined);
  }, []);

  const productSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const product = getProductById(products, item.id);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0),
    [cart, products],
  );
  const discount = firstOrderDiscountEligible && productSubtotal > 0
    ? applyFirstOrderDiscount(productSubtotal)
    : null;
  const payableProducts = discount?.total ?? productSubtotal;
  const shippingAmount = shippingAmountFor(shipping, payableProducts);
  const total = orderChargeAmount(payableProducts, shippingAmount);

  const startPayment = async () => {
    if (cart.length === 0 || busy) return;
    setBusy(true);
    setError("");
    trackBeginCheckout(total, cart.length);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart,
          shippingMethod: shipping,
          fullName,
          phone,
        }),
      });
      const data = await response.json() as { error?: string; paymentUrl?: string };
      if (!response.ok || !data.paymentUrl) {
        throw new Error(
          response.status === 503
            ? copy.notConfigured
            : response.status === 400 && data.error === "Israeli mobile phone required"
              ? copy.phoneRequired
              : data.error || copy.paymentFailed,
        );
      }
      consumeFirstOrderDiscount();
      clearCart();
      window.location.assign(data.paymentUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.notConfigured);
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="account-page checkout-page">
        <div className="account-page-header">
          <p className="account-eyebrow">SOLOVYEV STORE</p>
          <h1>{copy.title}</h1>
          {!user ? <p className="account-muted">{dict.account.signInHelp}</p> : null}
        </div>

        {cart.length === 0 ? (
          <div className="account-empty-block">
            <p className="account-muted">{copy.empty}</p>
            <Link href="/drops" className="btn-secondary account-empty-link">{copy.shop}</Link>
          </div>
        ) : (
          <div className="checkout-grid">
            <section className="account-card checkout-summary">
              <ul className="checkout-items">
                {cart.map((item) => {
                  const product = getProductById(products, item.id);
                  if (!product) return null;
                  const src = productImageSrc(product.img);
                  return (
                    <li key={`${item.id}-${item.size}`}>
                      {src ? (
                        <Image src={src} alt={product.title} width={72} height={72} />
                      ) : (
                        <span className="account-order-thumb-empty" aria-hidden="true" />
                      )}
                      <div className="checkout-item-meta">
                        <strong>{product.title}</strong>
                        <span>{item.size || dict.cart.oneSize}</span>
                      </div>
                      <b>{formatPrice(product.price, config.currency.symbol)}</b>
                    </li>
                  );
                })}
              </ul>
              <div className="checkout-totals">
                {discount && discount.discountAmount > 0 ? (
                  <p className="checkout-line">
                    <span>{dict.cart.firstOrderDiscount}</span>
                    <b>-{formatPrice(discount.discountAmount, config.currency.symbol)}</b>
                  </p>
                ) : null}
                <p className="checkout-line">
                  <span>{copy.shipping}</span>
                  <b>{shippingAmount === 0 ? copy.free : formatPrice(shippingAmount, config.currency.symbol)}</b>
                </p>
                <p className="checkout-total">
                  <span>{dict.cart.total}</span>
                  <b>{formatPrice(total, config.currency.symbol)}</b>
                </p>
                <p className="checkout-osek-note">{copy.osekNote}</p>
              </div>
            </section>

            <section className="account-card">
              <h2 className="checkout-section-title">{copy.delivery}</h2>
              <fieldset className="checkout-shipping" disabled={busy}>
                {SHIPPING_METHODS.map((method) => (
                  <label key={method} className="account-checkbox">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shipping === method}
                      onChange={() => setShipping(method)}
                    />
                    <span>
                      <strong>
                        {method === "pickup" ? copy.pickup : method === "locker" ? copy.locker : copy.courier}
                        {" · "}
                        {formatPrice(shippingAmountFor(method, payableProducts), config.currency.symbol)}
                      </strong>
                      <br />
                      {method === "pickup"
                        ? copy.pickupHint
                        : method === "locker"
                          ? copy.lockerHint
                          : `${copy.courierHint} ${copy.courierFree}`}
                    </span>
                  </label>
                ))}
              </fieldset>

              <h2 className="checkout-section-title">{copy.payer}</h2>
              <div className="account-form">
                <label>
                  {copy.payerName}
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    disabled={busy}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>
                <label>
                  {copy.payerPhone}
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder={dict.account.phonePlaceholder}
                    value={phone}
                    disabled={busy}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={busy || cart.length === 0}
                onClick={() => void startPayment()}
              >
                {busy ? copy.redirecting : copy.pay}
              </button>
              {error ? <p className="account-error" role="alert">{error}</p> : null}
            </section>
          </div>
        )}
      </main>
      <MinimalFooter />
      <CartDrawer />
      <QuickViewModal />
      <FaqModal />
      <SellTradeModal />
      <ToastNotification />
    </>
  );
}
