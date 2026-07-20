/** Safe image URL helpers for storefront rendering and SEO. */

/** Returns a usable image URL, or null when Next/Image must not render. */
export function productImageSrc(src: string | null | undefined): string | null {
  if (typeof src !== "string") return null;
  const trimmed = src.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Build an absolute image URL without double-prefixing http(s) sources. */
export function absoluteProductImageUrl(
  siteUrl: string,
  img: string | null | undefined,
): string | undefined {
  const src = productImageSrc(img);
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const base = siteUrl.replace(/\/$/, "");
  return src.startsWith("/") ? `${base}${src}` : `${base}/${src}`;
}
