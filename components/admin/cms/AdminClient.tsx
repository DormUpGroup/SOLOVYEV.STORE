"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductImage, ProductStatus, StoreConfig } from "@/lib/types";
import { normalizePendingRotate } from "@/lib/image-crop";
import { ProductList } from "./ProductList";
import { ProductForm, emptyFormProduct, type FormProduct } from "./ProductForm";
import type { TempImage } from "./ImageManager";

function productToTempImages(product: Product | FormProduct): TempImage[] {
  return (product.images ?? []).map((img) => ({
    tempId: `db-${img.id}`,
    id: img.id,
    imageUrl: img.imageUrl,
    altText: img.altText,
    objectPosition: img.objectPosition,
    cropZoom: img.cropZoom,
    cropMode: img.cropMode,
    pendingRotate: 0,
  }));
}

function tempImagesToPayload(images: TempImage[]) {
  return images.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    altText: img.altText,
    objectPosition: img.objectPosition,
    cropZoom: img.cropZoom,
    cropMode: img.cropMode,
  }));
}

export type AdminCatalogMode = "catalog" | "made_to_order" | "brand_new";

interface AdminClientProps {
  initialProducts: Product[];
  config: StoreConfig | null;
  onProductsChange?: (products: Product[]) => void;
  mode?: AdminCatalogMode;
}

export function AdminClient({
  initialProducts,
  config,
  onProductsChange,
  mode = "catalog",
}: AdminClientProps) {
  const [products, setProducts] = useState(initialProducts);

  // Keep in sync when parent Refresh / router.refresh() passes a new list.
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const updateProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onProductsChange?.(next);
      return next;
    });
  };
  const [formProduct, setFormProduct] = useState<FormProduct | null>(null);
  const [formImages, setFormImages] = useState<TempImage[]>([]);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [slugError, setSlugError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const originalImageIdsRef = useRef<number[]>([]);

  const router = useRouter();

  const flash = (text: string, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3500);
  };

  const publishSite = async () => {
    await fetch("/api/admin/publish", { method: "POST" });
    router.refresh();
  };

  const visibleProducts = useMemo(() => {
    if (mode === "made_to_order") {
      return products.filter((p) => p.status === "made_to_order");
    }
    if (mode === "brand_new") {
      return products.filter((p) => p.status === "brand_new");
    }
    return products.filter(
      (p) => p.status !== "made_to_order" && p.status !== "brand_new",
    );
  }, [products, mode]);

  const openAdd = () => {
    if (isFormDirty && !confirm("Discard unsaved changes?")) return;
    const defaultStatus: ProductStatus =
      mode === "made_to_order"
        ? "made_to_order"
        : mode === "brand_new"
          ? "brand_new"
          : "available";
    setFormProduct(emptyFormProduct(defaultStatus));
    setFormImages([]);
    originalImageIdsRef.current = [];
    setIsFormDirty(false);
    setSlugError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (product: Product) => {
    if (isFormDirty && !confirm("Discard unsaved changes?")) return;
    setFormProduct({ ...product });
    setFormImages(productToTempImages(product));
    originalImageIdsRef.current = (product.images ?? []).map((img) => img.id);
    setIsFormDirty(false);
    setSlugError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const closeForm = () => {
    if (isFormDirty && !confirm("Discard unsaved changes?")) return;
    setFormProduct(null);
    setFormImages([]);
    originalImageIdsRef.current = [];
    setIsFormDirty(false);
    setSlugError("");
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isFormDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isFormDirty]);

  const refreshProduct = useCallback(async (id: number) => {
    if (isFormDirty && !confirm("Discard unsaved changes?")) return;
    const res = await fetch(`/api/admin/products/${id}`);
    if (!res.ok) {
      flash("Failed to refresh product", false);
      return;
    }
    const json = (await res.json()) as { product: Product };
    updateProducts((prev) => prev.map((p) => (p.id === id ? json.product : p)));
    if (formProduct?.id === id) {
      setFormProduct(json.product);
      setFormImages(productToTempImages(json.product));
      originalImageIdsRef.current = (json.product.images ?? []).map((img) => img.id);
      setIsFormDirty(false);
    }
  }, [formProduct?.id, isFormDirty]);

  const handleSave = async () => {
    if (!formProduct) return;
    setIsBusy(true);
    setSlugError("");
    try {
      const images = await persistLocalEdits(formProduct.id || undefined, formImages);
      setFormImages(images);

      const payload = {
        title: formProduct.title,
        slug: formProduct.slug,
        category: formProduct.category,
        brand: formProduct.brand,
        badge: formProduct.badge,
        sizes: formProduct.sizes,
        price: formProduct.price,
        originalPrice: formProduct.originalPrice ?? null,
        condition: formProduct.condition,
        description: formProduct.description,
        status: formProduct.status,
        sold: formProduct.status === "sold",
        instagramUrl: formProduct.instagramUrl,
        sortOrder: formProduct.sortOrder,
        images: tempImagesToPayload(images),
        imageIds: images.map((img) => img.id).filter((id): id is number => id != null),
      };

      const isNew = !formProduct.id;
      const res = await fetch(
        isNew ? "/api/admin/products" : `/api/admin/products/${formProduct.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.status === 409) {
        setSlugError("This slug is already taken");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        flash(json.error ?? "Save failed", false);
        return;
      }

      const json = (await res.json()) as { product: Product };
      if (isNew) {
        updateProducts((prev) => [...prev, json.product]);
        setFormProduct(json.product);
        setFormImages(productToTempImages(json.product));
        originalImageIdsRef.current = (json.product.images ?? []).map((img) => img.id);
      } else {
        updateProducts((prev) => prev.map((p) => (p.id === json.product.id ? json.product : p)));
        setFormProduct(json.product);
        setFormImages(productToTempImages(json.product));
        originalImageIdsRef.current = (json.product.images ?? []).map((img) => img.id);
      }
      setIsFormDirty(false);
      setHighlightedId(json.product.id);
      setTimeout(() => setHighlightedId(null), 2200);
      flash("Product saved — live on site");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Save failed", false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const prev = products;
    updateProducts((p) => p.filter((x) => x.id !== id));
    if (formProduct?.id === id) closeForm();

    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      updateProducts(prev);
      flash("Delete failed", false);
      return;
    }
    await publishSite();
    flash("Product deleted — live on site");
  };

  const handleReorder = async (ids: number[]) => {
    const prev = products;
    const byId = new Map(products.map((p) => [p.id, p]));
    const reordered = ids.map((id) => byId.get(id)).filter(Boolean) as Product[];
    const missing = products.filter((p) => !ids.includes(p.id));
    updateProducts([...reordered, ...missing]);

    const res = await fetch("/api/admin/products/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ids.map(String) }),
    });
    if (!res.ok) {
      updateProducts(prev);
      flash("Reorder failed", false);
      return;
    }
    await publishSite();
  };

  async function persistLocalEdits(
    productId: number | undefined,
    images: TempImage[],
  ): Promise<TempImage[]> {
    let next = images;
    const deferQs = "?deferRevalidate=1";

    const toUpload = next.filter((img) => img.file);
    if (toUpload.length) {
      const uploaded = await Promise.all(
        toUpload.map(async (img) => {
          const fd = new FormData();
          fd.append("files", img.file!);
          const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error ?? "Upload failed");
          }
          const json = (await res.json()) as { urls: string[] };
          const url = json.urls?.[0];
          if (!url) throw new Error("Upload failed");
          return { tempId: img.tempId, url, prevUrl: img.imageUrl };
        }),
      );
      const byTemp = new Map(uploaded.map((row) => [row.tempId, row]));
      next = next.map((row) => {
        const hit = byTemp.get(row.tempId);
        if (!hit) return row;
        if (hit.prevUrl.startsWith("blob:")) URL.revokeObjectURL(hit.prevUrl);
        return { ...row, imageUrl: hit.url, file: undefined };
      });
    }

    const toRotate = next.filter((img) => normalizePendingRotate(img.pendingRotate ?? 0));
    if (toRotate.length) {
      const rotated = await Promise.all(
        toRotate.map(async (img) => {
          const rotate = normalizePendingRotate(img.pendingRotate ?? 0);
          if (productId && img.id) {
            const res = await fetch(
              `/api/admin/products/${productId}/images/${img.id}${deferQs}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rotate }),
              },
            );
            if (!res.ok) {
              const json = await res.json().catch(() => ({}));
              throw new Error(json.error ?? "Failed to rotate image");
            }
            const json = (await res.json()) as { image: ProductImage };
            return { tempId: img.tempId, imageUrl: json.image.imageUrl };
          }
          const res = await fetch("/api/admin/images/rotate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: img.imageUrl, degrees: rotate }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error ?? "Failed to rotate image");
          }
          const json = (await res.json()) as { url: string };
          return { tempId: img.tempId, imageUrl: json.url };
        }),
      );
      const byTemp = new Map(rotated.map((row) => [row.tempId, row.imageUrl]));
      next = next.map((row) => {
        const url = byTemp.get(row.tempId);
        return url ? { ...row, imageUrl: url, pendingRotate: 0 } : row;
      });
    }

    if (!productId) return next;

    const keepIds = new Set(
      next.map((img) => img.id).filter((id): id is number => id != null),
    );
    const toDelete = originalImageIdsRef.current.filter((imageId) => !keepIds.has(imageId));
    if (toDelete.length) {
      await Promise.all(
        toDelete.map(async (imageId) => {
          const res = await fetch(
            `/api/admin/products/${productId}/images/${imageId}${deferQs}`,
            { method: "DELETE" },
          );
          if (!res.ok) throw new Error("Failed to delete image");
        }),
      );
    }

    const toAdd = next.filter((img) => !img.id);
    if (toAdd.length) {
      const added = await Promise.all(
        toAdd.map(async (img) => {
          const res = await fetch(`/api/admin/products/${productId}/images${deferQs}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: img.imageUrl,
              objectPosition: img.objectPosition,
              cropZoom: img.cropZoom,
              cropMode: img.cropMode,
            }),
          });
          if (!res.ok) throw new Error("Failed to add image");
          const json = (await res.json()) as { image: ProductImage };
          return { tempId: img.tempId, image: json.image };
        }),
      );
      const byTemp = new Map(added.map((row) => [row.tempId, row.image]));
      next = next.map((row) => {
        const image = byTemp.get(row.tempId);
        if (!image) return row;
        return {
          ...row,
          id: image.id,
          tempId: `db-${image.id}`,
          imageUrl: image.imageUrl,
        };
      });
    }

    // Crop + reorder applied by the following product PUT
    return next;
  }

  const productEditor = formProduct ? (
    <div ref={formRef}>
      <ProductForm
        product={formProduct}
        config={config}
        images={formImages}
        slugError={slugError}
        isBusy={isBusy}
        onChange={(p) => {
          setFormProduct(p);
          setIsFormDirty(true);
        }}
        onImagesChange={(imgs) => {
          setFormImages(imgs);
          setIsFormDirty(true);
        }}
        onSave={handleSave}
        onCancel={closeForm}
        onRefreshProduct={
          formProduct.id ? () => refreshProduct(formProduct.id) : undefined
        }
      />
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {mode === "made_to_order" ? (
        <p className="admin-card px-4 py-3 text-sm text-admin-muted">
          Products here appear on the public page{" "}
          <a href="/made-to-order" target="_blank" rel="noreferrer" className="text-admin-accent underline">
            /made-to-order
          </a>
          . They are hidden from the main catalog.
        </p>
      ) : null}
      {mode === "brand_new" ? (
        <p className="admin-card px-4 py-3 text-sm text-admin-muted">
          Products here appear on the public page{" "}
          <a href="/brand-new" target="_blank" rel="noreferrer" className="text-admin-accent underline">
            /brand-new
          </a>
          . They are hidden from the main catalog. Items with brand-new condition in the main catalog also appear there automatically.
        </p>
      ) : null}

      <ProductList
        products={visibleProducts}
        highlightedId={highlightedId}
        onEdit={openEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onAdd={openAdd}
        editingProductId={formProduct?.id || null}
        inlineEditor={formProduct?.id ? productEditor : null}
        addLabel={
          mode === "made_to_order"
            ? "Add made-to-order item"
            : mode === "brand_new"
              ? "Add brand-new item"
              : undefined
        }
      />

      {formProduct && !formProduct.id ? productEditor : null}

      {message ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-admin ${
            message.ok
              ? "border-admin-success/35 bg-admin-surface text-admin-success"
              : "border-admin-danger/35 bg-admin-surface text-admin-danger"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
}
