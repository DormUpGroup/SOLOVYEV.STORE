"use client";

import { useCallback, useState } from "react";
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
import type { ProductImage } from "@/lib/types";
import { adminProductImageSrc } from "@/lib/admin-images";
import { ImagePositionEditor } from "./ImagePositionEditor";

export type TempImage = {
  tempId: string;
  imageUrl: string;
  altText?: string;
  objectPosition: string;
  id?: number;
};

interface ImageManagerProps {
  productId?: number;
  images: TempImage[];
  onChange: (images: TempImage[]) => void;
  onPersistReorder?: (imageIds: number[]) => Promise<void>;
  onPersistPosition?: (imageId: number, position: string) => Promise<void>;
  onPersistDelete?: (imageId: number) => Promise<void>;
  onPersistAdd?: (url: string) => Promise<ProductImage | void>;
  onRefreshProduct?: () => Promise<void>;
}

function SortableImageRow({
  image,
  index,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPositionChange,
}: {
  image: TempImage;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPositionChange: (pos: string) => void;
}) {
  const id = image.id ? String(image.id) : image.tempId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-admin-border bg-admin-bg p-3">
      <div className="flex gap-3">
        <button
          type="button"
          className="cursor-grab px-1 text-admin-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="h-16 w-16 shrink-0 overflow-hidden border border-admin-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={adminProductImageSrc(image.imageUrl, "thumb")}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: image.objectPosition }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-admin-muted">
            {index === 0 ? "MAIN" : `#${index + 1}`}
            {image.id ? ` · id ${image.id}` : " · temp"}
          </p>
          <p className="truncate text-xs">{image.imageUrl.split("/").pop()}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <button type="button" className="border border-admin-border px-2 py-0.5 text-xs" onClick={onEdit}>
              Crop
            </button>
            <button type="button" className="border border-admin-border px-2 py-0.5 text-xs" onClick={onMoveUp}>
              ↑
            </button>
            <button type="button" className="border border-admin-border px-2 py-0.5 text-xs" onClick={onMoveDown}>
              ↓
            </button>
            <button
              type="button"
              className="border border-admin-danger px-2 py-0.5 text-xs text-admin-danger"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-3">
          <ImagePositionEditor
            imageUrl={image.imageUrl}
            objectPosition={image.objectPosition}
            onChange={onPositionChange}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ImageManager({
  productId,
  images,
  onChange,
  onPersistReorder,
  onPersistPosition,
  onPersistDelete,
  onPersistAdd,
  onRefreshProduct,
}: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortableIds = images.map((img) => (img.id ? String(img.id) : img.tempId));

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      for (const file of Array.from(files)) fd.append("files", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Upload failed");
      }
      const json = (await res.json()) as { urls: string[] };
      const newImages = [...images];

      for (const url of json.urls) {
        if (productId && onPersistAdd) {
          const added = await onPersistAdd(url);
          if (added) {
            newImages.push({
              tempId: `db-${added.id}`,
              id: added.id,
              imageUrl: added.imageUrl,
              objectPosition: added.objectPosition,
              altText: added.altText,
            });
          }
        } else {
          newImages.push({
            tempId: `temp-${crypto.randomUUID()}`,
            imageUrl: url,
            objectPosition: "50% 50%",
          });
        }
      }
      onChange(newImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(images, oldIndex, newIndex);
      onChange(next);
      if (productId && onPersistReorder) {
        const ids = next.map((img) => img.id).filter((id): id is number => id != null);
        if (ids.length) await onPersistReorder(ids);
      }
    },
    [images, onChange, onPersistReorder, productId, sortableIds],
  );

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = arrayMove(images, index, target);
    onChange(next);
    if (productId && onPersistReorder) {
      const ids = next.map((img) => img.id).filter((id): id is number => id != null);
      if (ids.length) await onPersistReorder(ids);
    }
  };

  const handleDelete = async (index: number) => {
    const img = images[index];
    if (!img) return;
    if (img.id && productId && onPersistDelete) {
      await onPersistDelete(img.id);
    }
    onChange(images.filter((_, i) => i !== index));
  };

  const handlePositionChange = async (index: number, position: string) => {
    const next = images.map((img, i) => (i === index ? { ...img, objectPosition: position } : img));
    onChange(next);
    const img = next[index];
    if (img?.id && productId && onPersistPosition) {
      await onPersistPosition(img.id, position);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-widest text-admin-muted">Images</label>
        {onRefreshProduct ? (
          <button type="button" className="text-xs text-admin-accent" onClick={() => onRefreshProduct()}>
            Refresh product
          </button>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-center justify-center border border-dashed border-admin-border py-6 hover:border-admin-accent">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {uploading ? "Uploading…" : "+ Upload images (max 10MB each)"}
      </label>

      {error ? <p className="text-xs text-admin-danger">{error}</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {images.map((img, index) => {
              const key = img.id ? String(img.id) : img.tempId;
              return (
                <SortableImageRow
                  key={key}
                  image={img}
                  index={index}
                  isEditing={editingId === key}
                  onEdit={() => setEditingId(editingId === key ? null : key)}
                  onDelete={() => handleDelete(index)}
                  onMoveUp={() => move(index, -1)}
                  onMoveDown={() => move(index, 1)}
                  onPositionChange={(pos) => handlePositionChange(index, pos)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
