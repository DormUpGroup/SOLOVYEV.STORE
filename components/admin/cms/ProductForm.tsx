"use client";

import type { Product, ProductCategory, ProductStatus, StoreConfig } from "@/lib/types";
import { CLOTHING_TYPES, type ClothingType } from "@/lib/clothing-types";
import { slugify } from "@/lib/slug";
import { ImageManager, type TempImage } from "./ImageManager";
import { ProductPreview } from "./ProductPreview";

const STATUSES: ProductStatus[] = [
  "available",
  "reserved",
  "sold",
  "draft",
];
const CATEGORIES: ProductCategory[] = ["sneakers", "clothing", "accessories"];
const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  pants: "Pants",
  shorts: "Shorts",
  tshirts: "T-shirts",
  sweaters: "Hoodies / sweaters",
  jackets: "Jackets",
};

export type FormProduct = Product & { slug: string };

interface ProductFormProps {
  product: FormProduct;
  config: StoreConfig | null;
  images: TempImage[];
  slugError?: string;
  isBusy: boolean;
  onChange: (product: FormProduct) => void;
  onImagesChange: (images: TempImage[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onRefreshProduct?: () => Promise<void>;
}

export function ProductForm({
  product,
  config,
  images,
  slugError,
  isBusy,
  onChange,
  onImagesChange,
  onSave,
  onCancel,
  onRefreshProduct,
}: ProductFormProps) {
  const isNew = !product.id;

  const isPublished = product.status !== "draft";
  const specialStatus: "none" | "new_drop" | "made_to_order" | "brand_new" =
    product.status === "new_drop" ||
    product.status === "made_to_order" ||
    product.status === "brand_new"
      ? product.status
      : "none";

  const setSpecialStatus = (next: "none" | "new_drop" | "made_to_order" | "brand_new") => {
    if (next === "none") {
      onChange({
        ...product,
        status:
          product.status === "sold" || product.status === "reserved"
            ? product.status
            : isPublished
              ? "available"
              : "draft",
      });
      return;
    }
    onChange({ ...product, status: next });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="admin-card space-y-5 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isNew ? "New product" : `Edit #${product.id}`}</h3>
          <div className="flex gap-2">
            <button type="button" className="admin-btn px-4 py-1.5" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              disabled={isBusy}
              className="admin-btn admin-btn-primary px-4 py-1.5 disabled:opacity-50"
              onClick={onSave}
            >
              {isBusy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-admin-muted">Title</span>
            <input
              className="admin-input mt-1.5"
              value={product.title}
              onChange={(e) => {
                const title = e.target.value;
                onChange({
                  ...product,
                  title,
                  slug: slugify(title),
                });
              }}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-admin-muted">Slug (from title)</span>
            <input
              readOnly
              tabIndex={-1}
              className="admin-input mt-1.5 cursor-default text-admin-muted opacity-80"
              value={product.slug}
            />
            {slugError ? <p className="mt-1 text-xs text-admin-danger">{slugError}</p> : null}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-admin-muted">Brand</span>
            <input
              className="admin-input mt-1.5"
              value={product.brand}
              onChange={(e) => onChange({ ...product, brand: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-admin-muted">Category</span>
            <select
              className="admin-input mt-1.5"
              value={product.category}
              onChange={(e) => {
                const category = e.target.value as ProductCategory;
                onChange({
                  ...product,
                  category,
                  clothingType: category === "clothing" ? product.clothingType : undefined,
                });
              }}
            >
              {(config?.categories ?? CATEGORIES.map((id) => ({ id, label: id }))).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {product.category === "clothing" ? (
            <label className="block">
              <span className="text-sm font-medium text-admin-muted">Clothing type</span>
              <select
                className="admin-input mt-1.5"
                value={product.clothingType ?? ""}
                onChange={(e) =>
                  onChange({
                    ...product,
                    clothingType: (e.target.value || undefined) as ClothingType | undefined,
                  })
                }
              >
                <option value="">Select type</option>
                {CLOTHING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CLOTHING_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="text-sm font-medium text-admin-muted">Price</span>
            <input
              type="number"
              className="admin-input mt-1.5"
              value={product.price}
              onChange={(e) => onChange({ ...product, price: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-admin-muted">Original price</span>
            <input
              type="number"
              className="admin-input mt-1.5"
              value={product.originalPrice ?? ""}
              onChange={(e) =>
                onChange({
                  ...product,
                  originalPrice: e.target.value === "" ? undefined : Number(e.target.value) || undefined,
                })
              }
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-admin-muted">Status</span>
            <select
              className="admin-input mt-1.5"
              value={
                product.status === "new_drop" ||
                product.status === "made_to_order" ||
                product.status === "brand_new"
                  ? "available"
                  : product.status
              }
              onChange={(e) => onChange({ ...product, status: e.target.value as ProductStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-admin-muted">Badge</span>
            <select
              className="admin-input mt-1.5"
              value={product.badge}
              onChange={(e) => onChange({ ...product, badge: e.target.value })}
            >
              {(config?.badges ?? [{ id: "hot", label: "Hot" }]).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-admin-muted">Sizes (comma-separated)</span>
          <input
            className="admin-input mt-1.5"
            value={product.sizes.join(", ")}
            onChange={(e) =>
              onChange({
                ...product,
                sizes: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        <label className="block">
          <span className="text-xs text-admin-muted">Condition</span>
          <input
            className="admin-input mt-1.5"
            value={product.condition}
            onChange={(e) => onChange({ ...product, condition: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-xs text-admin-muted">Description</span>
          <textarea
            rows={3}
            className="admin-input mt-1.5"
            value={product.description ?? ""}
            onChange={(e) => onChange({ ...product, description: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-xs text-admin-muted">Instagram URL</span>
          <input
            className="admin-input mt-1.5"
            value={product.instagramUrl ?? ""}
            onChange={(e) => onChange({ ...product, instagramUrl: e.target.value })}
          />
        </label>

        <div className="flex flex-wrap gap-3 rounded-xl bg-admin-panel/60 p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) =>
                onChange({
                  ...product,
                  status: e.target.checked
                    ? product.status === "draft"
                      ? "available"
                      : product.status
                    : "draft",
                })
              }
            />
            Published (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="special-status"
              checked={specialStatus === "none"}
              onChange={() => setSpecialStatus("none")}
            />
            Regular catalog
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="special-status"
              checked={specialStatus === "new_drop"}
              onChange={() => setSpecialStatus("new_drop")}
            />
            New drop
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="special-status"
              checked={specialStatus === "made_to_order"}
              onChange={() => setSpecialStatus("made_to_order")}
            />
            Made to order (shows on /made-to-order page)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="special-status"
              checked={specialStatus === "brand_new"}
              onChange={() => setSpecialStatus("brand_new")}
            />
            Brand new (shows on /brand-new page)
          </label>
        </div>

        <ImageManager
          images={images}
          onChange={onImagesChange}
          onRefreshProduct={onRefreshProduct}
        />
      </div>

      <ProductPreview product={product} images={images} />
    </div>
  );
}

export function emptyFormProduct(defaultStatus: ProductStatus = "available"): FormProduct {
  return {
    id: 0,
    slug: "",
    title: "",
    category: "sneakers",
    price: 0,
    condition: "10/10 DS",
    brand: "",
    badge: "hot",
    sizes: [],
    img: "",
    status: defaultStatus,
    source: "admin",
  };
}
