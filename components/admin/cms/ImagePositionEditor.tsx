"use client";

import { useEffect, useRef, useState } from "react";
import {
  clampCropZoom,
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  parseObjectPosition,
  productImageCropStyle,
} from "@/lib/image-crop";

interface ImagePositionEditorProps {
  imageUrl: string;
  objectPosition: string;
  cropZoom: number;
  pendingRotate?: number;
  onSave: (position: string, cropZoom: number) => void | Promise<void>;
  onRotate?: (degrees: -90 | 90) => void;
  onCancel: () => void;
}

type PointerPoint = { x: number; y: number };
type DragStart = PointerPoint & { positionX: number; positionY: number };

function formatPosition(x: number, y: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  return `${clamp(x).toFixed(1)}% ${clamp(y).toFixed(1)}%`;
}

export function ImagePositionEditor({
  imageUrl,
  objectPosition,
  cropZoom,
  pendingRotate = 0,
  onSave,
  onRotate,
  onCancel,
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, PointerPoint>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const dragRef = useRef<DragStart | null>(null);
  const [position, setPosition] = useState(objectPosition);
  const [zoom, setZoom] = useState(clampCropZoom(cropZoom));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPosition(objectPosition);
    setZoom(clampCropZoom(cropZoom));
  }, [cropZoom, objectPosition]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onCancel]);

  const pointerDistance = () => {
    const points = [...pointersRef.current.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(position, Number(zoom.toFixed(2)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-5">
      <div
        className="flex max-h-[96dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1e] shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-label="Photo crop editor"
      >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <button
          type="button"
          className="min-w-16 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onCancel}
        >
          Cancel
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">Edit photo</p>
          <p className="text-[11px] text-white/50">Square crop</p>
        </div>
        <button
          type="button"
          className="min-w-16 rounded-full bg-admin-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-sm cursor-grab touch-none overflow-hidden bg-white select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointersRef.current.size === 1) {
            const current = parseObjectPosition(position);
            dragRef.current = {
              x: e.clientX,
              y: e.clientY,
              positionX: current.x,
              positionY: current.y,
            };
          } else if (pointersRef.current.size === 2) {
            pinchRef.current = { distance: pointerDistance(), zoom };
            dragRef.current = null;
          }
        }}
        onPointerMove={(e) => {
          if (!pointersRef.current.has(e.pointerId)) return;
          pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointersRef.current.size === 2 && pinchRef.current) {
            const distance = pointerDistance();
            const ratio = distance / Math.max(1, pinchRef.current.distance);
            setZoom(clampCropZoom(pinchRef.current.zoom * ratio));
          } else if (pointersRef.current.size === 1 && dragRef.current) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const dx = e.clientX - dragRef.current.x;
            const dy = e.clientY - dragRef.current.y;
            setPosition(
              formatPosition(
                dragRef.current.positionX - (dx / rect.width) * (100 / zoom),
                dragRef.current.positionY - (dy / rect.height) * (100 / zoom),
              ),
            );
          }
        }}
        onPointerUp={(e) => {
          pointersRef.current.delete(e.pointerId);
          pinchRef.current = null;
          dragRef.current = null;
        }}
        onPointerCancel={(e) => {
          pointersRef.current.delete(e.pointerId);
          pinchRef.current = null;
          dragRef.current = null;
        }}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((current) => clampCropZoom(current + (e.deltaY < 0 ? 0.1 : -0.1)));
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-contain pointer-events-none"
          style={productImageCropStyle(position, zoom, "free", pendingRotate)}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute left-1/3 top-0 h-full w-px bg-white/35" />
          <span className="absolute left-2/3 top-0 h-full w-px bg-white/35" />
          <span className="absolute left-0 top-1/3 h-px w-full bg-white/35" />
          <span className="absolute left-0 top-2/3 h-px w-full bg-white/35" />
          <span className="absolute inset-0 border border-white/70" />
        </div>
        <div
          className="absolute right-3 top-3 z-10 flex flex-col gap-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/70 text-2xl font-medium text-white shadow-lg backdrop-blur hover:bg-black"
            aria-label="Zoom in"
            onClick={() => setZoom((current) => clampCropZoom(current + 0.1))}
          >
            +
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/70 text-2xl font-medium text-white shadow-lg backdrop-blur hover:bg-black"
            aria-label="Zoom out"
            onClick={() => setZoom((current) => clampCropZoom(current - 0.1))}
          >
            −
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-white/55">
        Drag the photo to position it · Pinch or scroll to zoom
      </p>

      <div className="mx-auto mt-4 max-w-md space-y-3 rounded-xl bg-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-9 w-9 shrink-0 rounded-full bg-white/10 text-lg hover:bg-white/20"
            aria-label="Zoom out"
            onClick={() => setZoom((current) => clampCropZoom(current - 0.1))}
          >
            −
          </button>
          <input
            type="range"
            min={MIN_CROP_ZOOM}
            max={MAX_CROP_ZOOM}
            step="0.02"
            value={zoom}
            onChange={(e) => setZoom(clampCropZoom(Number(e.target.value)))}
            className="h-2 min-w-0 flex-1 cursor-pointer accent-[#0a84ff]"
            aria-label="Crop zoom"
          />
          <button
            type="button"
            className="h-9 w-9 shrink-0 rounded-full bg-white/10 text-lg hover:bg-white/20"
            aria-label="Zoom in"
            onClick={() => setZoom((current) => clampCropZoom(current + 0.1))}
          >
            +
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs tabular-nums text-white/60">
            Zoom {Math.round(zoom * 100)}%
          </span>
          <div className="flex items-center gap-1">
            {onRotate ? (
              <>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-lg text-white/80 hover:bg-white/10"
                  onClick={() => onRotate?.(-90)}
                  aria-label="Rotate left"
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-lg text-white/80 hover:bg-white/10"
                  onClick={() => onRotate?.(90)}
                  aria-label="Rotate right"
                >
                  ↻
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                setPosition("50% 50%");
                setZoom(1);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
