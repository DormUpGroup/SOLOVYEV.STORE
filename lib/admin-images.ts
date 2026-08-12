type ImageSize = "thumb" | "grid" | "preview" | "editor";

export function adminProductImageSrc(url: string, _size: ImageSize = "thumb"): string {
  if (!url) return "";
  // Admin previews use raw URLs (no next/image). Storefront uses optimized next/image.
  return url;
}
