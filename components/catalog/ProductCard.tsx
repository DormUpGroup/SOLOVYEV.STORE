"use client";

import Link from "next/link";
import {
  formatConditionScore,
  formatPrice,
  formatPriceOrDm,
  getStatusLabel,
  isProductUnavailable,
} from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProductImageLoupe } from "@/components/ui/ProductImageLoupe";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { config } = useStore();
  const { openQuickView } = useUI();
  const { dict } = useI18n();
  const sym = config.currency.symbol;
  const unavailable = isProductUnavailable(product);
  const statusLabel = getStatusLabel(product.status);
  const categoryLabel = dict.categories[product.category];
  const metaRight = statusLabel || formatConditionScore(product.condition);

  const open = () => openQuickView(product);

  return (
    <article
      className={`product-card ${product.category} ${unavailable ? "sold-out-card" : ""}`}
      data-id={product.id}
    >
      <button
        type="button"
        className="product-img-hit"
        onClick={open}
        aria-label={`View ${product.title}`}
      >
        <ProductImageLoupe
          src={product.img}
          alt={product.title}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </button>

      <div className="product-info">
        <div className="product-info-header">
          <span className="product-category">{categoryLabel}</span>
          <span className="product-condition-score">{metaRight}</span>
        </div>

        <h3 className="product-title">{product.title}</h3>

        <div className="product-footer">
          <div className="product-price-block">
            <span className="product-price">{formatPriceOrDm(product.price, sym)}</span>
            {product.originalPrice ? (
              <span className="original-price">
                {formatPrice(product.originalPrice, sym)}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="quick-view-btn"
            onClick={open}
            aria-label={`View ${product.title}`}
          >
            <EyeIcon />
          </button>
        </div>
      </div>

      <Link
        href={`/product/${product.slug}`}
        className="product-seo-link visually-hidden"
      >
        {product.title}
      </Link>
    </article>
  );
}
