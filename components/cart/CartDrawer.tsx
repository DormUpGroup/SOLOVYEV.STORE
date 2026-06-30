"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import {
  formatPrice,
  getProductById,
  products,
} from "@/lib/products";
import { buildCartMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackBeginCheckout } from "@/lib/analytics";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const { dict } = useI18n();
  const { cart: cartText } = dict;

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = getProductById(item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("no-scroll");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen, closeCart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    trackBeginCheckout(subtotal, cart.length);
    const message = buildCartMessage(cart, products, SITE_URL);
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
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
              const product = getProductById(item.id);
              if (!product) return null;
              return (
                <div
                  key={`${item.id}-${item.size}`}
                  className="cart-item"
                  data-id={item.id}
                  data-size={item.size}
                >
                  <div className="cart-item-img">
                    <Image
                      src={product.img}
                      alt={product.title}
                      width={80}
                      height={80}
                    />
                  </div>
                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{product.title}</h4>
                    <p className="cart-item-size">
                      {cartText.size}: {item.size || cartText.oneSize}
                    </p>
                    <div className="cart-item-price">
                      {formatPrice(product.price)}
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
            {cartText.subtotal}: <span id="cart-subtotal">{formatPrice(subtotal)}</span>
          </div>
          <button
            type="button"
            className={`btn-primary cart-checkout-btn ${cart.length === 0 ? "disabled" : ""}`}
            id="cart-checkout-btn"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            {cartText.checkout}
          </button>
        </div>
      </aside>
    </>
  );
}
