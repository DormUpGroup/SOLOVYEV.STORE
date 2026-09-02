"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatPrice,
  formatPriceOrDm,
  getStatusLabel,
} from "@/lib/products";
import { productImageCropStyle } from "@/lib/image-crop";
import { useI18n } from "@/components/providers/I18nProvider";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductImageLoupe } from "@/components/ui/ProductImageLoupe";
import { GuestDiscountLink } from "@/components/promo/GuestDiscountLink";
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
  const [activeImg, setActiveImg] = useState(
    () => product.img || product.images?.[0]?.imageUrl || "",
  );
  const categoryLabel =
    dict.categories[product.category as keyof typeof dict.categories] ??
    product.category;

  const galleryImages = useMemo(() => {
    const fromImages = (product.images ?? [])
      .map((image) => image.imageUrl)
      .filter(Boolean);
    if (fromImages.length > 0) return fromImages;
    return product.img ? [product.img] : [];
  }, [product]);

  useEffect(() => {
    setActiveImg(product.img || product.images?.[0]?.imageUrl || "");
  }, [product]);

  const activeImage =
    product.images?.find((image) => image.imageUrl === activeImg) ??
    product.images?.[0];

  return (
    <article className="product-page">
      <Link href="/drops" className="back-link">
        {dict.common.backToDrops}
      </Link>
      <div className="product-page-grid">
        <div className="product-page-media">
          <div className="product-page-image">
            <ProductImageLoupe
              src={activeImg || product.img}
              alt={product.title}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="product-page-img-loupe"
              lensSize={160}
              priority
              quality={78}
              objectPosition={activeImage?.objectPosition}
              cropZoom={activeImage?.cropZoom}
              cropMode={activeImage?.cropMode}
            />
            {statusLabel ? (
              <span className={`product-status-badge status-${product.status}`}>
                {statusLabel}
              </span>
            ) : null}
          </div>
          {galleryImages.length > 1 ? (
            <div className="product-page-thumbnails">
              {galleryImages.map((url, idx) => {
                const image = product.images?.find((item) => item.imageUrl === url);
                return (
                  <button
                    key={url + idx}
                    type="button"
                    className={`modal-thumb-btn${activeImg === url ? " active" : ""}`}
                    onClick={() => setActiveImg(url)}
                    aria-label={dict.product.photoN.replace("{n}", String(idx + 1))}
                  >
                    <Image
                      src={url}
                      alt={`${product.title} ${idx + 1}`}
                      fill
                      sizes="64px"
                      quality={55}
                      loading="lazy"
                      unoptimized
                      style={productImageCropStyle(
                        image?.objectPosition,
                        image?.cropZoom,
                        image?.cropMode,
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="product-page-details">
          <p className="product-page-brand">{product.brand}</p>
          <h1>{product.title}</h1>
          <div className="modal-price-row">
            <p className="modal-price">
              {formatPriceOrDm(product.price, currencySymbol)}
            </p>
            <GuestDiscountLink />
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
