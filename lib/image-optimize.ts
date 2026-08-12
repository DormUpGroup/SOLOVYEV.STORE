const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export async function optimizeImage(
  buffer: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (mime === "image/gif") {
    return { buffer, contentType: "image/gif", ext: "gif" };
  }

  const sharp = (await import("sharp")).default;
  const optimized = await sharp(buffer)
    .rotate()
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return { buffer: optimized, contentType: "image/webp", ext: "webp" };
}

export const ROTATE_DEGREES = [90, -90, 180, 270] as const;
export type RotateDegrees = (typeof ROTATE_DEGREES)[number];

export function isRotateDegrees(value: unknown): value is RotateDegrees {
  return typeof value === "number" && (ROTATE_DEGREES as readonly number[]).includes(value);
}

export async function rotateOptimizedImage(
  buffer: Buffer,
  degrees: RotateDegrees,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const sharp = (await import("sharp")).default;
  const rotated = await sharp(buffer).rotate(degrees).webp({ quality: 82 }).toBuffer();
  return { buffer: rotated, contentType: "image/webp", ext: "webp" };
}
