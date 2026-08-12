import Image from "next/image";

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

/** Fast admin thumbnails via Next.js image optimizer. */
export function AdminProductImage({
  src,
  alt = "",
  size = "thumb",
  className = "h-full w-full object-cover",
  objectPosition,
  priority = false,
}: {
  src: string;
  alt?: string;
  size?: ImageSize;
  className?: string;
  objectPosition?: string;
  priority?: boolean;
}) {
  const safe = adminProductImageSrc(src, size);
  if (!safe) return null;
  const preset = SIZE_PRESETS[size];

  return (
    <Image
      src={safe}
      alt={alt}
      width={preset.width}
      height={preset.height}
      sizes={preset.sizes}
      quality={preset.quality}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
