type ImageSize = "thumb" | "grid" | "preview" | "editor";

export function adminProductImageSrc(url: string, _size: ImageSize = "thumb"): string {
  if (!url) return "";
  // Local static assets and remote Supabase/Cloudinary URLs — use directly.
  // Wrapping remote URLs in /_next/image fails without remotePatterns configured.
  return url;
}
