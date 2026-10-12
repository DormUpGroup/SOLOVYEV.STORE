"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  formatPriceOrDm,
  isProductUnavailable,
} from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { trackBeginCheckout } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkoutLoginHref } from "@/lib/customer-auth";

interface ProductPurchasePanelProps {
  product: Product;
  showQuickView?: boolean;
}

export function ProductPurchasePanel({
  product,
  showQuickView = true,
}: ProductPurchasePanelProps) {
  const { config } = useStore();
  const { openQuickView } = useUI();
  const { addToCart } = useCart();
  const { dict } = useI18n();
  const { product: copy } = dict;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { user } = useAuth();
  const unavailable = isProductUnavailable(product);

  const handleBuyNow = () => {
    if (unavailable) return;
    if (!addToCart(product.id, selectedSize || "")) return;
    trackBeginCheckout(product.price, 1);
    window.location.href = user ? "/checkout" : checkoutLoginHref("/checkout");
  };

  return (
    <div className="product-purchase-panel">
      <div className="product-purchase-sticky sticky-mobile-cta">
        <h4>{copy.selectSize}:</h4>
        <div className="size-options">
          {unavailable ? (
            <button type="button" className="size-pill disabled" disabled>
              {copy.outOfStock}
            </button>
          ) : product.sizes.length === 0 ? (
            <span className="size-pill disabled">{copy.contactForSize}</span>
          ) : (
            product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`size-pill ${selectedSize === size ? "active" : ""}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))
          )}
        </div>
        <div className="purchase-primary-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={unavailable}
            onClick={() => addToCart(product.id, selectedSize || "")}
          >
            {copy.addToCart}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={unavailable}
            onClick={handleBuyNow}
          >
            {copy.orderWhatsApp}
          </button>
        </div>
      </div>
      <div className="modal-actions">
        {showQuickView ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openQuickView(product)}
          >
            QUICK VIEW
          </button>
        ) : null}
      </div>
      <p className="product-page-price-note">{formatPriceOrDm(product.price, config.currency.symbol)}</p>
    </div>
  );
}
