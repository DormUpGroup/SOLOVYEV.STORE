"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  formatPrice,
  getProductById,
} from "@/lib/products";
import { productImageSrc } from "@/lib/product-image";
import { useStore } from "@/components/providers/StoreProvider";
import { trackBeginCheckout } from "@/lib/analytics";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";
import { useAuth } from "@/components/providers/AuthProvider";

export function CartDrawer() {
  const { products, config } = useStore();
  const {
    cart,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const { dict } = useI18n();
  const { cart: cartText } = dict;

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = getProductById(products, item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart, products]);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [isOpen, closeCart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setCheckingOut(true);
    setCheckoutError("");
    trackBeginCheckout(subtotal, cart.length);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await response.json() as { whatsappUrl?: string; error?: string };
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!response.ok || !data.whatsappUrl) throw new Error(data.error || "Checkout failed");
      clearCart();
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="cart-drawer-backdrop open"
        id="cart-drawer-backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="cart-drawer open"
        id="cart-drawer"
        aria-label={cartText.title}
      >
        <div className="cart-drawer-header">
          <h3>{cartText.title}</h3>
          <button
            type="button"
            className="close-modal-btn"
            id="close-cart-btn"
            onClick={closeCart}
            aria-label={cartText.close}
          >
            ×
          </button>
        </div>

        <div className="cart-items-container" id="cart-items-container">
          {cart.length === 0 ? (
            <p className="cart-empty">{cartText.empty}</p>
          ) : (
            cart.map((item) => {
              const product = getProductById(products, item.id);
              if (!product) return null;
              return (
                <div
                  key={`${item.id}-${item.size}`}
                  className="cart-item"
                  data-id={item.id}
                  data-size={item.size}
                >
                  <div className="cart-item-img">
                    {productImageSrc(product.img) ? (
                      <Image
                        src={product.img}
                        alt={product.title}
                        width={80}
                        height={80}
                      />
                    ) : (
                      <div className="product-img-placeholder" aria-hidden="true" />
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{product.title}</h4>
                    <p className="cart-item-size">
                      {cartText.size}: {item.size || cartText.oneSize}
                    </p>
                    <div className="cart-item-price">
                      {formatPrice(product.price, config.currency.symbol)}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-qty-ctrl">
                      <button
                        type="button"
                        className="qty-minus"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.id, item.size, -1)}
                      >
                        &minus;
                      </button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-plus"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.id, item.size, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      aria-label="Remove item"
                      onClick={() => removeFromCart(item.id, item.size)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-subtotal-row">
            {cartText.subtotal}: <span id="cart-subtotal">{formatPrice(subtotal, config.currency.symbol)}</span>
          </div>
          <button
            type="button"
            className={`btn-primary cart-checkout-btn ${cart.length === 0 ? "disabled" : ""}`}
            id="cart-checkout-btn"
            disabled={cart.length === 0 || checkingOut}
            onClick={() => void handleCheckout()}
          >
            {checkingOut ? "CREATING ORDER…" : cartText.checkout}
          </button>
          {checkoutError ? <p className="account-error" role="alert">{checkoutError}</p> : null}
        </div>
      </aside>
    </>
  );
}
