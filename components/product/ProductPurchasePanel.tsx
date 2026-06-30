"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import {
  config,
  formatPriceOrDm,
  isProductUnavailable,
} from "@/lib/products";
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
  const { openQuickView } = useUI();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const unavailable = isProductUnavailable(product);

  const handleWhatsApp = () => {
    if (unavailable) return;
    if (product.sizes.length > 0 && !selectedSize) return;
    trackBeginCheckout(product.price, 1);
    window.open(
      buildWhatsAppUrl(
        buildSingleItemMessage(product, selectedSize, SITE_URL),
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="product-purchase-panel">
      <h4>Select Size:</h4>
      <div className="size-options">
        {unavailable ? (
          <button type="button" className="size-pill disabled" disabled>
            OUT OF STOCK
          </button>
        ) : product.sizes.length === 0 ? (
          <span className="size-pill disabled">DM FOR SIZE</span>
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
          ADD TO CART
        </button>
        <button
          type="button"
          className="btn-secondary whatsapp-cta"
          disabled={unavailable}
          onClick={handleWhatsApp}
        >
          ORDER VIA WHATSAPP
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
        <a
          href={config.contacts.instagramUrl}
          className="btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          DM ON INSTAGRAM
        </a>
      </div>
      <p className="product-page-price-note">{formatPriceOrDm(product.price)}</p>
    </div>
  );
}
