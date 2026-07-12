type ImageSize = "thumb" | "grid" | "preview" | "editor";

const SIZES: Record<ImageSize, number> = {
  thumb: 80,
  grid: 200,
  preview: 400,
  editor: 600,
};

export function adminProductImageSrc(url: string, size: ImageSize = "thumb"): string {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  const w = SIZES[size];
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}
