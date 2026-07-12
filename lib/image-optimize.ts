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
