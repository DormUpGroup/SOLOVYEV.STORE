"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import {
  formatPrice,
  getProductById,
} from "@/lib/products";
import { productImageSrc } from "@/lib/product-image";
import { productImageCropStyle } from "@/lib/image-crop";
import { useStore } from "@/components/providers/StoreProvider";
import { trackBeginCheckout } from "@/lib/analytics";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkoutLoginHref } from "@/lib/customer-auth";
import { applyFirstOrderDiscount } from "@/lib/first-order-discount";
import { GuestDiscountLink } from "@/components/promo/GuestDiscountLink";

export function CartDrawer() {
  const { products, config } = useStore();
  const {
    cart,
    isOpen,
    closeCart,
    removeFromCart,
  } = useCart();
  const { user, firstOrderDiscountEligible } = useAuth();
  const { dict } = useI18n();
  const { cart: cartText } = dict;

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = getProductById(products, item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart, products]);

  const discount = firstOrderDiscountEligible && subtotal > 0
    ? applyFirstOrderDiscount(subtotal)
    : null;
  const showDiscount = Boolean(discount && discount.discountAmount > 0);

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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    trackBeginCheckout(subtotal, cart.length);
    closeCart();
    window.location.href = user ? "/checkout" : checkoutLoginHref("/checkout");
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
              const mainImage =
                product.images?.find((image) => image.imageUrl === product.img) ??
                product.images?.[0];
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
                        width={88}
                        height={104}
                        sizes="88px"
                        quality={55}
                        loading="lazy"
                        unoptimized
                        style={productImageCropStyle(
                          mainImage?.objectPosition,
                          mainImage?.cropZoom,
                          mainImage?.cropMode,
                        )}
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
                      <GuestDiscountLink
                        price={product.price}
                        symbol={config.currency.symbol}
                      />
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <button
                      type="button"
                      className="remove-btn"
                      aria-label={cartText.removeItem}
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
          {showDiscount && discount ? (
            <>
              <div className="cart-subtotal-row cart-subtotal-original">
                {cartText.subtotal}: <span>{formatPrice(discount.original, config.currency.symbol)}</span>
              </div>
              <div className="cart-subtotal-row cart-discount-row">
                {cartText.firstOrderDiscount}: <span>-{formatPrice(discount.discountAmount, config.currency.symbol)}</span>
              </div>
              <div className="cart-subtotal-row">
                {cartText.total}: <span id="cart-subtotal">{formatPrice(discount.total, config.currency.symbol)}</span>
              </div>
            </>
          ) : (
            <div className="cart-subtotal-row">
              {cartText.subtotal}: <span id="cart-subtotal">{formatPrice(subtotal, config.currency.symbol)}</span>
            </div>
          )}
          {!user && cart.length > 0 ? (
            <p className="cart-discount-hint">{cartText.guestDiscountHint}</p>
          ) : null}
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
