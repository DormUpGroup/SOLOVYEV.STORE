"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductImage, ProductStatus, StoreConfig } from "@/lib/types";
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
  }));
}

function tempImagesToPayload(images: TempImage[]) {
  return images.map((img) => ({
    imageUrl: img.imageUrl,
    altText: img.altText,
    objectPosition: img.objectPosition,
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

  const flash = (text: string, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3500);
  };

  const publishSite = async () => {
    await fetch("/api/admin/publish", { method: "POST" });
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
    setIsFormDirty(false);
    setSlugError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (product: Product) => {
    if (isFormDirty && !confirm("Discard unsaved changes?")) return;
    setFormProduct({ ...product });
    setFormImages(productToTempImages(product));
    setIsFormDirty(false);
    setSlugError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const closeForm = () => {
    if (isFormDirty && !confirm("Discard unsaved changes?")) return;
    setFormProduct(null);
    setFormImages([]);
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
    }
  }, [formProduct?.id]);

  const handleSave = async () => {
    if (!formProduct) return;
    setIsBusy(true);
    setSlugError("");
    try {
      const payload = {
        title: formProduct.title,
        slug: formProduct.slug,
        category: formProduct.category,
        brand: formProduct.brand,
        badge: formProduct.badge,
        sizes: formProduct.sizes,
        price: formProduct.price,
        originalPrice: formProduct.originalPrice,
        condition: formProduct.condition,
        description: formProduct.description,
        status: formProduct.status,
        sold: formProduct.status === "sold",
        instagramUrl: formProduct.instagramUrl,
        sortOrder: formProduct.sortOrder,
        images: tempImagesToPayload(formImages),
        imageIds: formImages.map((img) => img.id).filter((id): id is number => id != null),
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
      } else {
        updateProducts((prev) => prev.map((p) => (p.id === json.product.id ? json.product : p)));
        setFormProduct(json.product);
        setFormImages(productToTempImages(json.product));
      }
      setIsFormDirty(false);
      setHighlightedId(json.product.id);
      setTimeout(() => setHighlightedId(null), 2200);
      await publishSite();
      flash("Product saved — live on site");
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
    flash("Product deleted");
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
    }
  };

  const persistAddImage = async (url: string) => {
    if (!formProduct?.id) return;
    const res = await fetch(`/api/admin/products/${formProduct.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    if (!res.ok) throw new Error("Failed to add image");
    const json = (await res.json()) as { image: ProductImage; product: Product };
    setFormProduct(json.product);
    setFormImages(productToTempImages(json.product));
    updateProducts((prev) => prev.map((p) => (p.id === json.product.id ? json.product : p)));
    await publishSite();
    return json.image;
  };

  const persistReorderImages = async (imageIds: number[]) => {
    if (!formProduct?.id) return;
    const res = await fetch(`/api/admin/products/${formProduct.id}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds }),
    });
    if (!res.ok) throw new Error("Failed to reorder images");
    const json = (await res.json()) as { product: Product };
    setFormProduct(json.product);
    setFormImages(productToTempImages(json.product));
    await publishSite();
  };

  const persistPosition = async (imageId: number, objectPosition: string) => {
    if (!formProduct?.id) return;
    await fetch(`/api/admin/products/${formProduct.id}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectPosition }),
    });
    setIsFormDirty(true);
  };

  const persistDeleteImage = async (imageId: number) => {
    if (!formProduct?.id) return;
    const res = await fetch(`/api/admin/products/${formProduct.id}/images/${imageId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete image");
    const json = (await res.json()) as { product: Product };
    setFormProduct(json.product);
    setFormImages(productToTempImages(json.product));
    await publishSite();
  };

  const handleMarkSold = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product || product.status === "sold") return;
    if (!confirm(`Mark "${product.title}" as sold?`)) return;

    const prev = products;
    updateProducts((list) =>
      list.map((p) =>
        p.id === id ? { ...p, status: "sold" as ProductStatus, sold: true, price: 0 } : p,
      ),
    );
    if (formProduct?.id === id) {
      setFormProduct((p) =>
        p ? { ...p, status: "sold", sold: true, price: 0 } : p,
      );
    }

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sold", sold: true, price: 0 }),
    });
    if (!res.ok) {
      updateProducts(prev);
      flash("Failed to mark as sold", false);
      return;
    }
    const json = (await res.json()) as { product: Product };
    updateProducts((list) => list.map((p) => (p.id === id ? json.product : p)));
    if (formProduct?.id === id) {
      setFormProduct(json.product);
    }
    flash("Marked as sold");
  };

  return (
    <div className="space-y-6">
      {mode === "made_to_order" ? (
        <p className="border border-admin-border bg-admin-panel px-4 py-3 text-sm text-admin-muted">
          Products here appear on the public page{" "}
          <a href="/made-to-order" target="_blank" rel="noreferrer" className="text-admin-accent underline">
            /made-to-order
          </a>
          . They are hidden from the main catalog.
        </p>
      ) : null}
      {mode === "brand_new" ? (
        <p className="border border-admin-border bg-admin-panel px-4 py-3 text-sm text-admin-muted">
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
        onMarkSold={handleMarkSold}
        addLabel={
          mode === "made_to_order"
            ? "+ Add made-to-order item"
            : mode === "brand_new"
              ? "+ Add brand-new item"
              : undefined
        }
      />

      {formProduct ? (
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
            onPersistReorder={formProduct.id ? persistReorderImages : undefined}
            onPersistPosition={formProduct.id ? persistPosition : undefined}
            onPersistDelete={formProduct.id ? persistDeleteImage : undefined}
            onPersistAdd={formProduct.id ? persistAddImage : undefined}
            onRefreshProduct={formProduct.id ? () => refreshProduct(formProduct.id) : undefined}
          />
        </div>
      ) : null}

      {message ? (
        <div
          className={`fixed bottom-4 right-4 z-50 border px-4 py-2 ${
            message.ok ? "border-admin-success bg-admin-panel" : "border-admin-danger bg-admin-panel"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
}
