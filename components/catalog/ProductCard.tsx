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
import { FavoriteButton } from "@/components/catalog/FavoriteButton";

interface ProductCardProps {
  product: Product;
  /** First viewport cards — prioritize image fetch for faster LCP. */
  priority?: boolean;
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

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { config } = useStore();
  const { openQuickView } = useUI();
  const { dict } = useI18n();
  const sym = config.currency.symbol;
  const unavailable = isProductUnavailable(product);
  const statusLabel = getStatusLabel(product.status, dict.product);
  const categoryLabel = dict.categories[product.category];
  const metaRight = statusLabel || formatConditionScore(product.condition);
  const href = `/product/${product.slug}`;
  const viewLabel = dict.product.viewProduct.replace("{title}", product.title);
  const mainImage =
    product.images?.find((image) => image.imageUrl === product.img) ??
    product.images?.[0];

  return (
    <article
      className={`product-card ${product.category} ${unavailable ? "sold-out-card" : ""}`}
      data-id={product.id}
    >
      <FavoriteButton productId={product.id} />
      <Link href={href} className="product-img-hit" aria-label={viewLabel}>
        <ProductImageLoupe
          src={product.img}
          alt={product.title}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority={priority}
          quality={65}
          objectPosition={mainImage?.objectPosition}
          cropZoom={mainImage?.cropZoom}
          cropMode={mainImage?.cropMode}
        />
      </Link>

      <div className="product-info">
        <div className="product-info-header">
          <span className="product-category">{categoryLabel}</span>
          <span className="product-condition-score">{metaRight}</span>
        </div>

        <Link href={href} className="product-title-link">
          <h3 className="product-title">{product.title}</h3>
        </Link>

        <div className="product-footer">
          <Link href={href} className="product-price-block">
            <span className="product-price">{formatPriceOrDm(product.price, sym)}</span>
            {product.originalPrice ? (
              <span className="original-price">
                {formatPrice(product.originalPrice, sym)}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="quick-view-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openQuickView(product);
            }}
            aria-label={`View ${product.title}`}
          >
            <EyeIcon />
          </button>
        </div>
      </div>
    </article>
  );
}
