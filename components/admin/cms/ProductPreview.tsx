"use client";

import type { Product, ProductImage } from "@/lib/types";
import { adminProductImageSrc } from "@/lib/admin-images";

interface ProductPreviewProps {
  product: Partial<Product> & { title: string; brand: string; price: number };
  images: Array<ProductImage | { imageUrl: string; objectPosition?: string }>;
}

export function ProductPreview({ product, images }: ProductPreviewProps) {
  const main = images[0];
  const mainUrl = main?.imageUrl ?? product.img ?? "";
  const position = main && "objectPosition" in main ? main.objectPosition : "50% 50%";

  return (
    <div className="sticky top-4 space-y-4">
      <p className="text-xs uppercase tracking-widest text-admin-muted">Live preview</p>

      <div className="border border-admin-border bg-admin-panel p-3">
        <p className="mb-2 text-xs text-admin-muted">Catalog card</p>
        <div className="overflow-hidden border border-admin-border bg-admin-bg">
          <div className="relative aspect-square bg-neutral-900">
            {mainUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={adminProductImageSrc(mainUrl, "preview")}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: position ?? "50% 50%" }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-admin-muted">No image</div>
            )}
            {product.status === "new_drop" ? (
              <span className="absolute left-2 top-2 bg-white px-2 py-0.5 text-xs font-bold text-black">
                NEW DROP
              </span>
            ) : null}
          </div>
          <div className="p-3">
            <p className="text-xs text-admin-muted">{product.brand}</p>
            <p className="font-bold">{product.title || "Product title"}</p>
            <p className="mt-1">
              {product.price > 0 ? `₪${product.price}` : "—"}
              {product.originalPrice ? (
                <span className="ml-2 text-admin-muted line-through">₪{product.originalPrice}</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="border border-admin-border bg-admin-panel p-3">
        <p className="mb-2 text-xs text-admin-muted">Product page</p>
        <div className="grid grid-cols-2 gap-2">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="aspect-square overflow-hidden border border-admin-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adminProductImageSrc(img.imageUrl, "grid")}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: img.objectPosition ?? "50% 50%" }}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 font-bold">{product.title || "Product title"}</p>
        <p className="text-xs text-admin-muted">{product.condition}</p>
        {product.description ? (
          <p className="mt-2 line-clamp-4 text-xs text-admin-muted">{product.description}</p>
        ) : null}
      </div>
    </div>
  );
}
