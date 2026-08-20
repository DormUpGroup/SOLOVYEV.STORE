"use client";

import type { Product, ProductImage } from "@/lib/types";
import { AdminProductImage } from "@/lib/admin-images";

interface ProductPreviewProps {
  product: Partial<Product> & { title: string; brand: string; price: number };
  images: Array<
    | ProductImage
    | {
        imageUrl: string;
        objectPosition?: string;
        cropZoom?: number;
        cropMode?: "cover" | "free";
        pendingRotate?: number;
      }
  >;
}

export function ProductPreview({ product, images }: ProductPreviewProps) {
  const main = images[0];
  const mainUrl = main?.imageUrl ?? product.img ?? "";
  const position = main && "objectPosition" in main ? main.objectPosition : "50% 50%";
  const cropZoom = main && "cropZoom" in main ? main.cropZoom : 1;
  const cropMode = main && "cropMode" in main ? main.cropMode : "cover";
  const pendingRotate = main && "pendingRotate" in main ? main.pendingRotate : 0;

  return (
    <div className="sticky top-24 space-y-4">
      <p className="text-sm font-medium text-admin-muted">Live preview</p>

      <div className="admin-card p-4">
        <p className="mb-3 text-xs font-medium text-admin-muted">Catalog card</p>
        <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-panel">
          <div className="relative aspect-square bg-white">
            {mainUrl ? (
              <AdminProductImage
                src={mainUrl}
                size="preview"
                className="h-full w-full object-contain"
                objectPosition={position ?? "50% 50%"}
                cropZoom={cropZoom ?? 1}
                cropMode={cropMode ?? "cover"}
                rotateDeg={pendingRotate ?? 0}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-admin-muted">No image</div>
            )}
            {product.status === "new_drop" ? (
              <span className="absolute left-2 top-2 rounded-full bg-admin-accent px-2.5 py-0.5 text-xs font-semibold text-white">
                New drop
              </span>
            ) : null}
          </div>
          <div className="p-4">
            <p className="text-xs text-admin-muted">{product.brand}</p>
            <p className="font-semibold">{product.title || "Product title"}</p>
            <p className="mt-1">
              {product.price > 0 ? `₪${product.price}` : "—"}
              {product.originalPrice ? (
                <span className="ml-2 text-admin-muted line-through">₪{product.originalPrice}</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card p-4">
        <p className="mb-3 text-xs font-medium text-admin-muted">Product page</p>
        <div className="grid grid-cols-2 gap-2">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-lg bg-white">
              <AdminProductImage
                src={img.imageUrl}
                size="grid"
                className="h-full w-full object-contain"
                objectPosition={img.objectPosition ?? "50% 50%"}
                cropZoom={img.cropZoom ?? 1}
                cropMode={img.cropMode ?? "cover"}
                rotateDeg={"pendingRotate" in img ? img.pendingRotate : 0}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 font-semibold">{product.title || "Product title"}</p>
        <p className="text-xs text-admin-muted">{product.condition}</p>
        {product.description ? (
          <p className="mt-2 line-clamp-4 text-xs text-admin-muted">{product.description}</p>
        ) : null}
      </div>
    </div>
  );
}
