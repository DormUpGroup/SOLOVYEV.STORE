"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  formatPriceOrDm,
  getStatusLabel,
} from "@/lib/products";
import { productImageSrc } from "@/lib/product-image";
import { useI18n } from "@/components/providers/I18nProvider";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import type { Product } from "@/lib/types";

interface ProductPageDetailsProps {
  product: Product;
  currencySymbol: string;
}

export function ProductPageDetails({
  product,
  currencySymbol,
}: ProductPageDetailsProps) {
  const { dict } = useI18n();
  const statusLabel = getStatusLabel(product.status, dict.product);
  const safeImg = productImageSrc(product.img);
  const categoryLabel =
    dict.categories[product.category as keyof typeof dict.categories] ??
    product.category;

  return (
    <article className="product-page">
      <Link href="/drops" className="back-link">
        {dict.common.backToDrops}
      </Link>
      <div className="product-page-grid">
        <div className="product-page-image">
          {safeImg ? (
            <Image
              src={safeImg}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={78}
              priority
            />
          ) : (
            <div className="product-img-placeholder" aria-hidden="true" />
          )}
          {statusLabel ? (
            <span className={`product-status-badge status-${product.status}`}>
              {statusLabel}
            </span>
          ) : null}
        </div>
        <div className="product-page-details">
          <p className="product-page-brand">{product.brand}</p>
          <h1>{product.title}</h1>
          <div className="modal-price-row">
            <p className="modal-price">
              {formatPriceOrDm(product.price, currencySymbol)}
            </p>
            <FavoriteButton productId={product.id} variant="inline" />
          </div>
          {product.description ? (
            <p className="product-description">{product.description}</p>
          ) : null}
          {product.originalPrice ? (
            <p className="original-price-inline">
              {dict.product.was}{" "}
              {formatPrice(product.originalPrice, currencySymbol)}
            </p>
          ) : null}
          <p>
            <strong>{dict.product.condition}:</strong> {product.condition}
          </p>
          <p>
            <strong>{dict.product.category}:</strong> {categoryLabel}
          </p>
          <p>
            <strong>{dict.product.sizes}:</strong>{" "}
            {product.sizes.length
              ? product.sizes.join(", ")
              : dict.product.na}
          </p>
          <ProductPurchasePanel product={product} showQuickView={false} />
        </div>
      </div>
    </article>
  );
}
