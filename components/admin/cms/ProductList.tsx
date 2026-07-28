"use client";

import { useMemo, useState } from "react";
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
import type { Product, ProductCategory } from "@/lib/types";
import { adminProductImageSrc } from "@/lib/admin-images";

const STATUS_LABELS: Record<Product["status"], string> = {
  available: "AVAILABLE",
  new_drop: "NEW DROP",
  reserved: "RESERVED",
  sold: "SOLD",
  draft: "DRAFT",
  made_to_order: "MADE TO ORDER",
  brand_new: "BRAND NEW",
};

const STATUS_BADGE_CLASS: Record<Product["status"], string> = {
  available: "border-admin-success/60 bg-admin-success/15 text-admin-success",
  new_drop: "border-admin-accent/70 bg-admin-accent/20 text-admin-accent",
  reserved: "border-amber-400/70 bg-amber-400/15 text-amber-300",
  sold: "border-admin-danger/70 bg-admin-danger/15 text-admin-danger",
  draft: "border-admin-border bg-admin-panel text-admin-muted",
  made_to_order: "border-sky-400/70 bg-sky-400/15 text-sky-300",
  brand_new: "border-emerald-400/70 bg-emerald-400/15 text-emerald-300",
};

interface ProductListProps {
  products: Product[];
  highlightedId: number | null;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
  onAdd: () => void;
  addLabel?: string;
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
      className={`flex items-center gap-3 border border-admin-border bg-admin-bg p-2 ${
        highlighted ? "ring-2 ring-admin-accent" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab shrink-0 px-1 text-admin-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="h-20 w-20 shrink-0 overflow-hidden border border-admin-border">
        {product.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={adminProductImageSrc(product.img, "thumb")} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 shrink">
        <p className="truncate font-bold">{product.title}</p>
        <p className="text-xs text-admin-muted">
          #{product.id} · {product.brand}
        </p>
      </div>
      <span className="ml-8 shrink-0 px-3 text-base font-bold tabular-nums text-white">
        {product.price > 0 ? `₪${product.price}` : "—"}
      </span>
      <div className="flex flex-1 items-center justify-center pr-[12%]">
        <span
          className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_BADGE_CLASS[product.status]}`}
        >
          {STATUS_LABELS[product.status]}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="border border-admin-border px-2 py-0.5 text-xs hover:bg-admin-panel"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="border border-admin-danger px-2 py-0.5 text-xs text-admin-danger hover:bg-admin-danger/10"
          onClick={onDelete}
        >
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
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-admin-border bg-admin-bg px-3 py-1.5"
        />
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="border border-admin-border bg-admin-bg px-3 py-1.5"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ml-auto bg-admin-success px-3 py-1.5 font-bold text-black"
          onClick={onAdd}
        >
          {addLabel ?? "+ Add product"}
        </button>
      </div>

      {[...grouped.entries()].map(([brand, catMap]) => (
        <div key={brand} className="border border-admin-border">
          <div className="border-b border-admin-border bg-admin-panel px-3 py-2 font-bold">{brand}</div>
          {[...catMap.entries()].map(([category, catProducts]) => (
            <div key={category} className="p-3">
              <p className="mb-2 text-xs uppercase tracking-widest text-admin-muted">{category}</p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(catProducts)}
              >
                <SortableContext
                  items={catProducts.map((p) => String(p.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {catProducts.map((p) => (
                      <SortableRow
                        key={p.id}
                        product={p}
                        highlighted={highlightedId === p.id}
                        onEdit={() => onEdit(p)}
                        onDelete={() => onDelete(p.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      ))}

      {filtered.length === 0 ? (
        <p className="text-center text-admin-muted py-8">No products match filters.</p>
      ) : null}
    </div>
  );
}
