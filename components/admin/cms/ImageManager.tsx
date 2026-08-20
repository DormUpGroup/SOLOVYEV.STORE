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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addPendingRotate, type PendingRotate } from "@/lib/image-crop";
import { AdminProductImage } from "@/lib/admin-images";
import { ImagePositionEditor } from "./ImagePositionEditor";

export type TempImage = {
  tempId: string;
  imageUrl: string;
  altText?: string;
  objectPosition: string;
  cropZoom: number;
  cropMode: "cover" | "free";
  pendingRotate?: PendingRotate;
  file?: File;
  id?: number;
};

interface ImageManagerProps {
  images: TempImage[];
  onChange: (images: TempImage[]) => void;
  onRefreshProduct?: () => Promise<void>;
}

function SortableThumbnail({
  image,
  index,
  selected,
  onSelect,
}: {
  image: TempImage;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const id = image.id ? String(image.id) : image.tempId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-24 shrink-0 rounded-xl border-2 p-1 transition ${
        selected ? "border-admin-accent bg-admin-accent/10" : "border-admin-border bg-admin-panel"
      }`}
    >
      <button
        type="button"
        className="block w-full"
        onClick={onSelect}
        aria-label={`Edit image ${index + 1}`}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded bg-white">
          <AdminProductImage
            src={image.imageUrl}
            size="thumb"
            className="h-full w-full object-contain"
            objectPosition={image.objectPosition}
            cropZoom={image.cropZoom}
            cropMode={image.cropMode}
            rotateDeg={image.pendingRotate ?? 0}
          />
        </div>
        <span className="mt-1 block truncate text-center text-[10px] font-medium text-admin-muted">
          {index === 0 ? "Main" : `#${index + 1}`}
        </span>
      </button>
      <button
        type="button"
        className="absolute left-1 top-1 z-10 cursor-grab rounded-md bg-black/60 px-1.5 py-0.5 text-admin-muted active:cursor-grabbing"
        aria-label={`Reorder image ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
    </div>
  );
}

export function ImageManager({
  images,
  onChange,
  onRefreshProduct,
}: ImageManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortableIds = images.map((img) => (img.id ? String(img.id) : img.tempId));
  const selectedKey =
    selectedId && sortableIds.includes(selectedId)
      ? selectedId
      : (sortableIds[0] ?? null);
  const selectedIndex = selectedKey ? sortableIds.indexOf(selectedKey) : -1;
  const selectedImage = selectedIndex >= 0 ? images[selectedIndex] : undefined;

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const next = [...images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large (max 10MB)");
        continue;
      }
      next.push({
        tempId: `temp-${crypto.randomUUID()}`,
        imageUrl: URL.createObjectURL(file),
        objectPosition: "50% 50%",
        cropZoom: 1,
        cropMode: "cover",
        pendingRotate: 0,
        file,
      });
    }
    onChange(next);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      onChange(arrayMove(images, oldIndex, newIndex));
    },
    [images, onChange, sortableIds],
  );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    onChange(arrayMove(images, index, target));
  };

  const handleDelete = (index: number) => {
    const img = images[index];
    if (!img) return;
    if (img.imageUrl.startsWith("blob:")) URL.revokeObjectURL(img.imageUrl);
    onChange(images.filter((_, i) => i !== index));
  };

  const handleCropSave = async (index: number, position: string, cropZoom: number) => {
    const next = images.map((img, i) =>
      i === index
        ? { ...img, objectPosition: position, cropZoom, cropMode: "free" as const }
        : img,
    );
    onChange(next);
    setEditingId(null);
  };

  const handleRotate = (index: number, degrees: -90 | 90) => {
    const img = images[index];
    if (!img) return;
    onChange(
      images.map((row, i) =>
        i === index
          ? { ...row, pendingRotate: addPendingRotate(row.pendingRotate, degrees) }
          : row,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-admin-muted">Images</label>
        {onRefreshProduct ? (
          <button type="button" className="text-sm text-admin-accent hover:underline" onClick={() => onRefreshProduct()}>
            Refresh product
          </button>
        ) : null}
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-admin-border-strong bg-admin-panel/40 py-8 text-sm text-admin-muted transition hover:border-admin-accent hover:bg-admin-accent/5 hover:text-admin-text">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
        + Add images
      </label>

      {error ? <p className="text-sm text-admin-danger">{error}</p> : null}

      {selectedImage && selectedKey ? (
        <div className="admin-card space-y-4 p-4">
          <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-lg bg-white">
            <AdminProductImage
              src={selectedImage.imageUrl}
              size="preview"
              className="h-full w-full object-contain"
              objectPosition={selectedImage.objectPosition}
              cropZoom={selectedImage.cropZoom}
              cropMode={selectedImage.cropMode}
              rotateDeg={selectedImage.pendingRotate ?? 0}
            />
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {selectedIndex === 0 ? "Main" : `Photo ${selectedIndex + 1}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" className="admin-btn px-4 py-2" onClick={() => setEditingId(selectedKey)}>
              Crop & edit
            </button>
            <button
              type="button"
              className="admin-btn px-3 py-2 text-lg"
              onClick={() => handleRotate(selectedIndex, -90)}
              aria-label="Rotate left"
            >
              ↺
            </button>
            <button
              type="button"
              className="admin-btn px-3 py-2 text-lg"
              onClick={() => handleRotate(selectedIndex, 90)}
              aria-label="Rotate right"
            >
              ↻
            </button>
            <button
              type="button"
              className="admin-btn px-3 py-2 text-sm disabled:opacity-30"
              disabled={selectedIndex === 0}
              onClick={() => move(selectedIndex, -1)}
            >
              ← Earlier
            </button>
            <button
              type="button"
              className="admin-btn px-3 py-2 text-sm disabled:opacity-30"
              disabled={selectedIndex === images.length - 1}
              onClick={() => move(selectedIndex, 1)}
            >
              Later →
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger px-3 py-2 text-sm"
              onClick={() => handleDelete(selectedIndex)}
            >
              Delete
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-admin-muted">
              Gallery · click to edit · drag to reorder
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableIds}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => {
                    const key = img.id ? String(img.id) : img.tempId;
                    return (
                      <SortableThumbnail
                        key={key}
                        image={img}
                        index={index}
                        selected={selectedKey === key}
                        onSelect={() => setSelectedId(key)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {editingId === selectedKey ? (
            <ImagePositionEditor
              imageUrl={selectedImage.imageUrl}
              objectPosition={selectedImage.objectPosition}
              cropZoom={selectedImage.cropZoom}
              pendingRotate={selectedImage.pendingRotate ?? 0}
              onSave={(position, cropZoom) =>
                handleCropSave(selectedIndex, position, cropZoom)
              }
              onRotate={(degrees) => handleRotate(selectedIndex, degrees)}
              onCancel={() => setEditingId(null)}
            />
          ) : null}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-admin-muted">
          Upload photos to start editing.
        </p>
      )}
    </div>
  );
}
