import Image from "next/image";
import { productImageCropStyle } from "@/lib/image-crop";
import type { CropMode } from "@/lib/image-crop";

type ImageSize = "thumb" | "grid" | "preview" | "editor";

const SIZE_PRESETS: Record<
  ImageSize,
  { width: number; height: number; sizes: string; quality: number }
> = {
  thumb: { width: 80, height: 80, sizes: "80px", quality: 50 },
  grid: { width: 200, height: 200, sizes: "200px", quality: 55 },
  preview: { width: 420, height: 420, sizes: "(max-width: 768px) 50vw, 420px", quality: 65 },
  editor: { width: 96, height: 96, sizes: "96px", quality: 50 },
};

export function adminProductImageSrc(url: string, _size: ImageSize = "thumb"): string {
  if (!url) return "";
  return url;
}

/** Admin thumbnails — direct URLs (global `images.unoptimized` bypasses Vercel optimizer). */
export function AdminProductImage({
  src,
  alt = "",
  size = "thumb",
  className = "h-full w-full object-contain",
  objectPosition,
  cropZoom = 1,
  cropMode = "cover",
  rotateDeg = 0,
  priority = false,
}: {
  src: string;
  alt?: string;
  size?: ImageSize;
  className?: string;
  objectPosition?: string;
  cropZoom?: number;
  cropMode?: CropMode;
  rotateDeg?: number;
  priority?: boolean;
}) {
  const safe = adminProductImageSrc(src, size);
  if (!safe) return null;
  const preset = SIZE_PRESETS[size];
  const cropStyle = productImageCropStyle(objectPosition, cropZoom, cropMode, rotateDeg);
  const isLocal = safe.startsWith("blob:") || safe.startsWith("data:");

  if (isLocal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={safe} alt={alt} className={className} style={cropStyle} />
    );
  }

  return (
    <Image
      src={safe}
      alt={alt}
      width={preset.width}
      height={preset.height}
      sizes={preset.sizes}
      quality={preset.quality}
      className={className}
      style={cropStyle}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      unoptimized
    />
  );
}
