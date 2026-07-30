"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  formatPriceOrDm,
  isProductUnavailable,
} from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { trackBeginCheckout, trackViewItem } from "@/lib/analytics";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkoutLoginHref } from "@/lib/customer-auth";
import { ProductImageLoupe } from "@/components/ui/ProductImageLoupe";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import type { ProductStatus } from "@/lib/types";

export function QuickViewModal() {
  const { config } = useStore();
  const { activeModal, selectedProduct, closeAll } = useUI();
  const { addToCart } = useCart();
  const { dict } = useI18n();
  const { user } = useAuth();
  const { product, sellTrade } = dict;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState<string>("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const galleryImages = useMemo(() => {
    if (!selectedProduct) return [];
    const fromImages = (selectedProduct.images ?? []).map((i) => i.imageUrl).filter(Boolean);
    if (fromImages.length > 0) return fromImages;
    return selectedProduct.img ? [selectedProduct.img] : [];
  }, [selectedProduct]);

  const statusLabels: Record<ProductStatus, string> = {
    available: "",
    new_drop: product.statusNewDrop,
    reserved: product.statusReserved,
    sold: product.statusSold,
    draft: product.statusDraft,
    made_to_order: product.statusMadeToOrder,
    brand_new: product.statusBrandNew,
  };

  useEffect(() => {
    setSelectedSize(null);
    setCheckoutError("");
    if (selectedProduct && activeModal === "quickView") {
      setActiveImg(selectedProduct.img || selectedProduct.images?.[0]?.imageUrl || "");
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

  const handleWhatsApp = async () => {
    if (unavailable) return;
    if (selectedProduct.sizes.length > 0 && !selectedSize) return;
    if (!user) {
      addToCart(selectedProduct.id, selectedSize || "");
      window.location.href = checkoutLoginHref(window.location.pathname);
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    trackBeginCheckout(selectedProduct.price, 1);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ id: selectedProduct.id, size: selectedSize || "", quantity: 1, qty: 1 }],
        }),
      });
      const data = await response.json() as { whatsappUrl?: string; error?: string };
      if (response.status === 401) {
        addToCart(selectedProduct.id, selectedSize || "");
        window.location.href = checkoutLoginHref(window.location.pathname);
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
    <div className="modal open" id="quick-view-modal" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={closeAll} aria-hidden="true" />
      <div className="modal-content quick-view-modal-content">
        <button type="button" className="close-modal-btn" onClick={closeAll} aria-label={sellTrade.close}>
          ×
        </button>
        <div className="modal-grid">
          <div className="modal-image">
            <FavoriteButton productId={selectedProduct.id} />
            <ProductImageLoupe
              src={activeImg || selectedProduct.img}
              alt={selectedProduct.title}
              sizes="(max-width: 768px) 100vw, 580px"
              className="modal-img-loupe"
              lensSize={160}
            />
            {galleryImages.length > 1 && (
              <div className="modal-thumbnails">
                {galleryImages.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    className={`modal-thumb-btn${activeImg === url ? " active" : ""}`}
                    onClick={() => setActiveImg(url)}
                    aria-label={product.photoN.replace("{n}", String(idx + 1))}
                  >
                    <Image src={url} alt={`${selectedProduct.title} ${idx + 1}`} fill sizes="64px" style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
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
                disabled={unavailable || checkoutBusy}
                onClick={() => void handleWhatsApp()}
              >
                {checkoutBusy ? dict.cart.creatingOrder : product.orderWhatsApp}
              </button>
            </div>
            {checkoutError ? <p className="account-error" role="alert">{checkoutError}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
