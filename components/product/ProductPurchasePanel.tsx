"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  formatPriceOrDm,
  isProductUnavailable,
} from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import {
  buildSingleItemMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import { trackBeginCheckout } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { useState } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

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
  const unavailable = isProductUnavailable(product);

  const handleWhatsApp = () => {
    if (unavailable) return;
    if (product.sizes.length > 0 && !selectedSize) return;
    trackBeginCheckout(product.price, 1);
    window.open(
      buildWhatsAppUrl(
        buildSingleItemMessage(product, selectedSize, SITE_URL, config),
        config,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="product-purchase-panel">
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
      <div className="modal-actions">
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
          className="btn-secondary whatsapp-cta"
          disabled={unavailable}
          onClick={handleWhatsApp}
        >
          {copy.orderWhatsApp}
        </button>
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
