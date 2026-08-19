import type { CSSProperties } from "react";

export const MIN_CROP_ZOOM = 0.5;
export const MAX_CROP_ZOOM = 3;
const CROP_SEPARATOR = "|";
export type CropMode = "cover" | "free";

export function decodeCropSettings(value = "50% 50%"): {
  objectPosition: string;
  cropZoom: number;
  cropMode: CropMode;
} {
  const [position = "50% 50%", rawZoom, rawMode] = value.split(CROP_SEPARATOR);
  return {
    objectPosition: position.trim() || "50% 50%",
    cropZoom: clampCropZoom(rawZoom == null ? 1 : Number(rawZoom)),
    cropMode: rawMode === "free" ? "free" : "cover",
  };
}

export function encodeCropSettings(
  objectPosition: string,
  cropZoom: number,
  cropMode: CropMode = "free",
): string {
  return [
    objectPosition,
    clampCropZoom(cropZoom).toFixed(2),
    cropMode,
  ].join(CROP_SEPARATOR);
}

export function parseObjectPosition(position = "50% 50%"): {
  x: number;
  y: number;
} {
  const [rawX = "50", rawY = "50"] = position.trim().split(/\s+/);
  const parsedX = Number.parseFloat(rawX);
  const parsedY = Number.parseFloat(rawY);
  return {
    x: Number.isFinite(parsedX) ? Math.max(0, Math.min(100, parsedX)) : 50,
    y: Number.isFinite(parsedY) ? Math.max(0, Math.min(100, parsedY)) : 50,
  };
}

export function clampCropZoom(zoom: number | null | undefined): number {
  const value = Number(zoom ?? 1);
  if (!Number.isFinite(value)) return 1;
  return Math.max(MIN_CROP_ZOOM, Math.min(MAX_CROP_ZOOM, value));
}

export type PendingRotate = 0 | 90 | 180 | 270;

export function normalizePendingRotate(degrees: number): PendingRotate {
  const normalized = ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
  return normalized as PendingRotate;
}

export function addPendingRotate(
  current: number | undefined,
  delta: number,
): PendingRotate {
  return normalizePendingRotate((current ?? 0) + delta);
}

export function productImageCropStyle(
  objectPosition = "50% 50%",
  cropZoom = 1,
  cropMode: CropMode = "cover",
  rotateDeg = 0,
): CSSProperties {
  const zoom = clampCropZoom(cropZoom);
  const rotate = normalizePendingRotate(rotateDeg);
  const rotatePart = rotate ? `rotate(${rotate}deg)` : "";

  // Default mode ("cover"): we still want the full photo inside 1:1.
  // So we use `object-fit: contain` and rely on browser `object-position`
  // for alignment (no translate).
  if (cropMode !== "free") {
    const style: CSSProperties = {
      objectFit: "contain",
      objectPosition,
    };

    if (zoom !== 1) {
      style.transform = `scale(${zoom}) ${rotatePart}`.trim();
      style.transformOrigin = "50% 50%";
    } else if (rotatePart) {
      style.transform = rotatePart;
      style.transformOrigin = "50% 50%";
    }

    return style;
  }

  // "free" mode: apply editor pan/zoom via translate/scale, while keeping
  // the original visible when zoom=1.
  const { x, y } = parseObjectPosition(objectPosition);
  return {
    objectFit: "contain",
    objectPosition: "50% 50%",
    transform:
      zoom === 1 && x === 50 && y === 50 && !rotatePart
        ? undefined
        : `translate(${50 - x}%, ${50 - y}%) scale(${zoom}) ${rotatePart}`.trim(),
    transformOrigin: "50% 50%",
  };
}
