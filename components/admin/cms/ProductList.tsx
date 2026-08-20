"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/types";
import { AdminProductImage } from "@/lib/admin-images";

const STATUS_LABELS: Record<Product["status"], string> = {
  available: "Available",
  new_drop: "New drop",
  reserved: "Reserved",
  sold: "Sold",
  draft: "Draft",
  made_to_order: "Made to order",
  brand_new: "Brand new",
};

const STATUS_BADGE_CLASS: Record<Product["status"], string> = {
  available: "bg-admin-success/15 text-admin-success",
  new_drop: "bg-admin-accent/15 text-[#64b5ff]",
  reserved: "bg-admin-warning/15 text-[#ffe066]",
  sold: "bg-admin-danger/15 text-[#ff6961]",
  draft: "bg-white/8 text-admin-muted",
  made_to_order: "bg-sky-400/15 text-sky-300",
  brand_new: "bg-emerald-400/15 text-emerald-300",
};

interface ProductListProps {
  products: Product[];
  highlightedId: number | null;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
  onAdd: () => void;
  addLabel?: string;
  editingProductId?: number | null;
  inlineEditor?: ReactNode;
}

function SortableRow({
  product,
  highlighted,
  onEdit,
  onDelete,
}: {
  product: Product;
  highlighted: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(product.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[auto_5rem_minmax(0,1fr)_5rem_7.5rem_auto] items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-3 transition hover:bg-white/[0.03] ${
        highlighted ? "ring-2 ring-admin-accent/50" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab shrink-0 rounded-md p-1 text-admin-muted hover:bg-white/5 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
        {product.img ? (
          <AdminProductImage
            src={product.img}
            size="thumb"
            className="h-full w-full object-contain"
            objectPosition={product.images?.[0]?.objectPosition}
            cropZoom={product.images?.[0]?.cropZoom}
            cropMode={product.images?.[0]?.cropMode}
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{product.title}</p>
        <p className="text-xs text-admin-muted">
          #{product.id} · {product.brand}
        </p>
      </div>
      <span className="text-base font-semibold tabular-nums text-admin-text">
        {product.price > 0 ? `₪${product.price}` : "—"}
      </span>
      <div className="flex justify-center">
        <span className={`admin-pill ${STATUS_BADGE_CLASS[product.status]}`}>
          {STATUS_LABELS[product.status]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="admin-btn px-3 py-1 text-xs" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="admin-btn admin-btn-danger px-3 py-1 text-xs" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function ProductList({
  products,
  highlightedId,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
  addLabel,
  editingProductId,
  inlineEditor,
}: ProductListProps) {
  const [brandFilter, setBrandFilter] = useState("");
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;
    if (brandFilter) list = list.filter((p) => p.brand === brandFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, brandFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<ProductCategory, Product[]>>();
    for (const p of filtered) {
      if (!map.has(p.brand)) map.set(p.brand, new Map());
      const catMap = map.get(p.brand)!;
      if (!catMap.has(p.category)) catMap.set(p.category, []);
      catMap.get(p.category)!.push(p);
    }
    return map;
  }, [filtered]);

  const handleDragEnd = (categoryProducts: Product[]) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = categoryProducts.map((p) => String(p.id));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(categoryProducts, oldIndex, newIndex);
    const reorderedIds = reordered.map((p) => p.id);

    const allIds = products.map((p) => p.id);
    const catIdSet = new Set(categoryProducts.map((p) => p.id));
    const withoutCat = allIds.filter((id) => !catIdSet.has(id));
    const insertAt = allIds.findIndex((id) => id === categoryProducts[0]?.id);
    const next = [
      ...withoutCat.slice(0, insertAt >= 0 ? insertAt : withoutCat.length),
      ...reorderedIds,
      ...withoutCat.slice(insertAt >= 0 ? insertAt : withoutCat.length),
    ].filter((id, i, arr) => arr.indexOf(id) === i);

    onReorder(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input max-w-xs"
        />
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="admin-input w-auto"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn admin-btn-primary ml-auto gap-1.5" onClick={onAdd}>
          <Plus size={16} />
          {addLabel ?? "Add product"}
        </button>
      </div>

      {[...grouped.entries()].map(([brand, catMap]) => (
        <div key={brand} className="admin-card overflow-hidden">
          <div className="border-b border-admin-border bg-admin-panel/50 px-4 py-3 font-semibold">
            {brand}
          </div>
          {[...catMap.entries()].map(([category, catProducts]) => (
            <div key={category} className="p-3">
              <p className="mb-2 text-xs font-medium capitalize text-admin-muted">{category}</p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(catProducts)}
              >
                <SortableContext
                  items={catProducts.map((p) => String(p.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {catProducts.map((p) => (
                      <Fragment key={p.id}>
                        <SortableRow
                          product={p}
                          highlighted={highlightedId === p.id}
                          onEdit={() => onEdit(p)}
                          onDelete={() => onDelete(p.id)}
                        />
                        {editingProductId === p.id && inlineEditor ? (
                          <div className="my-3 rounded-xl border border-admin-accent/30 bg-admin-accent/5 p-4">
                            {inlineEditor}
                          </div>
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      ))}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-admin-muted">No products match filters.</p>
      ) : null}
    </div>
  );
}
