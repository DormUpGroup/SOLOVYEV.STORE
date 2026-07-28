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
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { useAuth } from "@/components/providers/AuthProvider";

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
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const unavailable = isProductUnavailable(product);

  const handleWhatsApp = async () => {
    if (unavailable) return;
    if (product.sizes.length > 0 && !selectedSize) return;
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    trackBeginCheckout(product.price, 1);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [{ id: product.id, size: selectedSize || "", quantity: 1, qty: 1 }] }),
      });
      const data = await response.json() as { whatsappUrl?: string; error?: string };
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!response.ok || !data.whatsappUrl) throw new Error(data.error || "Checkout failed");
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setCheckoutBusy(false);
    }
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
          disabled={unavailable || checkoutBusy}
          onClick={() => void handleWhatsApp()}
        >
          {checkoutBusy ? "CREATING ORDER…" : copy.orderWhatsApp}
        </button>
        <button
          type="button"
          className={`btn-secondary${favoriteIds.has(product.id) ? " active" : ""}`}
          onClick={() => void toggleFavorite(product.id)}
          aria-pressed={favoriteIds.has(product.id)}
        >
          {favoriteIds.has(product.id) ? "♥ SAVED" : "♡ SAVE"}
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
      {checkoutError ? <p className="account-error" role="alert">{checkoutError}</p> : null}
      <p className="product-page-price-note">{formatPriceOrDm(product.price, config.currency.symbol)}</p>
    </div>
  );
}
