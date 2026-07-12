"use client";

import { useEffect, useState } from "react";
import {
  formatPriceOrDm,
  isProductUnavailable,
} from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import {
  buildSingleItemMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import { trackBeginCheckout, trackViewItem } from "@/lib/analytics";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProductImageLoupe } from "@/components/ui/ProductImageLoupe";
import type { ProductStatus } from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export function QuickViewModal() {
  const { config } = useStore();
  const { activeModal, selectedProduct, closeAll } = useUI();
  const { addToCart } = useCart();
  const { dict } = useI18n();
  const { product, sellTrade } = dict;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const statusLabels: Record<ProductStatus, string> = {
    available: "",
    new_drop: product.statusNewDrop,
    reserved: product.statusReserved,
    sold: product.statusSold,
    draft: "DRAFT",
    made_to_order: product.statusMadeToOrder,
    brand_new: product.statusBrandNew,
  };

  useEffect(() => {
    setSelectedSize(null);
    if (selectedProduct && activeModal === "quickView") {
      trackViewItem(selectedProduct);
    }
  }, [selectedProduct, activeModal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  if (activeModal !== "quickView" || !selectedProduct) return null;

  const unavailable = isProductUnavailable(selectedProduct);
  const statusLabel = statusLabels[selectedProduct.status];

  const handleWhatsApp = () => {
    if (unavailable) return;
    if (selectedProduct.sizes.length > 0 && !selectedSize) return;
    trackBeginCheckout(selectedProduct.price, 1);
    const message = buildSingleItemMessage(
      selectedProduct,
      selectedSize,
      SITE_URL,
      config,
    );
    window.open(buildWhatsAppUrl(message, config), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="modal open" id="quick-view-modal" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={closeAll} aria-hidden="true" />
      <div className="modal-content quick-view-modal-content">
        <button type="button" className="close-modal-btn" onClick={closeAll} aria-label={sellTrade.close}>
          ×
        </button>
        <div className="modal-grid">
          <div className="modal-image">
            <ProductImageLoupe
              src={selectedProduct.img}
              alt={selectedProduct.title}
              sizes="(max-width: 768px) 100vw, 580px"
              className="modal-img-loupe"
              lensSize={160}
            />
          </div>
          <div className="modal-details">
            <span
              className={`modal-badge ${unavailable ? "sold-out" : ""} ${statusLabel ? `status-${selectedProduct.status}` : ""}`}
              id="modal-product-badge"
            >
              {statusLabel || selectedProduct.badge.toUpperCase()}
            </span>
            <h2 id="modal-product-title">{selectedProduct.title}</h2>
            <p className="modal-price" id="modal-product-price">
              {formatPriceOrDm(selectedProduct.price, config.currency.symbol)}
            </p>

            <div className="product-specs">
              <div className="spec-row">
                <span className="spec-label">{product.condition}</span>
                <span className="spec-val" id="modal-product-condition">
                  {selectedProduct.condition}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">{product.brand}</span>
                <span className="spec-val" id="modal-product-brand">
                  {selectedProduct.brand}
                </span>
              </div>
            </div>

            <div className="size-selection-area">
              <h4>{product.selectSize}:</h4>
              <div className="size-options" id="modal-size-options">
              {unavailable ? (
                <button type="button" className="size-pill disabled" disabled>
                  {product.outOfStock}
                </button>
              ) : selectedProduct.sizes.length === 0 ? (
                <span className="size-pill disabled">{product.contactForSize}</span>
              ) : (
                selectedProduct.sizes.map((size) => (
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
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                id="add-to-cart-btn"
                disabled={unavailable}
                onClick={() => {
                  if (addToCart(selectedProduct.id, selectedSize || "")) {
                    closeAll();
                  }
                }}
              >
                {product.addToCart}
              </button>
              <button
                type="button"
                className={`btn-secondary whatsapp-cta ${unavailable ? "disabled" : ""}`}
                id="whatsapp-order-btn"
                disabled={unavailable}
                onClick={handleWhatsApp}
              >
                {product.orderWhatsApp}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
