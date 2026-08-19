import brandLogosData from "@/data/brand-logos.json";
import type {
  ActiveFilters,
  Product,
  ProductStatus,
  StoreConfig,
} from "./types";

export const brandLogos = brandLogosData as Record<string, string>;
/** Bump when brand logo files change to bust browser/CDN cache. */
export const brandLogosVersion = "2026-08-19e";

const BRAND_SLUG_ALIASES: Record<string, string> = {
  "d-and-g": "dandg",
  "d-g": "dandg",
  "cp-company": "c-p-company",
};

export function getProductBySlug(
  items: Product[],
  slug: string,
): Product | undefined {
  return items.find((p) => p.slug === slug);
}

export function getProductById(
  items: Product[],
  id: number,
): Product | undefined {
  return items.find((p) => p.id === id);
}

export function isProductUnavailable(product: Product): boolean {
  if (product.sold === true) return true;
  if (product.status === "sold" || product.status === "reserved") return true;
  if (product.status === "draft") return true;
  // Made-to-order / brand-new: inquire via WhatsApp — sizes optional
  if (product.status === "made_to_order" || product.status === "brand_new") {
    return false;
  }
  if (product.source === "instagram" && product.status === "available") {
    return false;
  }
  return !product.sizes || product.sizes.length === 0;
}

export function getStatusLabel(
  status: ProductStatus,
  labels?: {
    statusNewDrop: string;
    statusReserved: string;
    statusSold: string;
    statusDraft: string;
    statusMadeToOrder: string;
    statusBrandNew: string;
  },
): string {
  const fallback = {
    statusNewDrop: "NEW DROP",
    statusReserved: "RESERVED",
    statusSold: "SOLD",
    statusDraft: "DRAFT",
    statusMadeToOrder: "MADE TO ORDER",
    statusBrandNew: "BRAND NEW",
  };
  const L = labels ?? fallback;
  const map: Record<ProductStatus, string> = {
    available: "",
    new_drop: L.statusNewDrop,
    reserved: L.statusReserved,
    sold: L.statusSold,
    draft: L.statusDraft,
    made_to_order: L.statusMadeToOrder,
    brand_new: L.statusBrandNew,
  };
  return map[status];
}

export function isBrandNewCondition(condition: string): boolean {
  return /10\s*\/\s*10|DS|deadstock|brand\s*new|חדש/i.test(condition.trim());
}

export function isBrandNewProduct(product: Product): boolean {
  return product.status === "brand_new" || isBrandNewCondition(product.condition);
}

export function formatConditionScore(condition: string): string {
  const normalized = condition.trim();
  const slashMatch = normalized.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (slashMatch) return `${slashMatch[1]}/10`;

  const wordMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:out|of)\s*10/i);
  if (wordMatch) return `${wordMatch[1]}/10`;

  if (/^see description$/i.test(normalized)) return "—";

  return normalized;
}

export function getPublicImagePath(img: string): string {
  return img.startsWith("/") ? img : `/${img.replace(/^assets\//, "assets/")}`;
}

export function brandToSlug(brand: string): string {
  return brand
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAvailableBrands(items: Product[]): string[] {
  const brands = new Set(items.map((p) => p.brand.trim()));
  return Array.from(brands).sort((a, b) => a.localeCompare(b));
}

export function getBrandBySlug(
  items: Product[],
  slug: string,
): string | undefined {
  return getAvailableBrands(items).find(
    (brand) => brandToSlug(brand) === slug,
  );
}

export function getBrandLogoPath(brand: string): string {
  const slug = brandToSlug(brand);
  const resolvedSlug = BRAND_SLUG_ALIASES[slug] ?? slug;
  const compactSlug = resolvedSlug.replace(/-/g, "");

  const path =
    brandLogos[slug] ??
    brandLogos[resolvedSlug] ??
    brandLogos[compactSlug] ??
    `/assets/brands/${resolvedSlug}.svg`;

  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}v=${brandLogosVersion}`;
}

export function getBrandProductCount(brand: string, items: Product[]): number {
  return items.filter((p) => p.brand.trim() === brand).length;
}

export interface BrandDirectoryEntry {
  name: string;
  slug: string;
  count: number;
  logo: string;
}

export function getBrandsDirectory(items: Product[]): BrandDirectoryEntry[] {
  return getAvailableBrands(items).map((name) => ({
    name,
    slug: brandToSlug(name),
    count: getBrandProductCount(name, items),
    logo: getBrandLogoPath(name),
  }));
}

export function filterProducts(
  items: Product[],
  filters: ActiveFilters,
): Product[] {
  let result = [...items];

  if (filters.category !== "all") {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.brand) {
    result = result.filter((p) => p.brand.trim() === filters.brand);
  }

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
  }

  if (filters.size) {
    result = result.filter((p) => p.sizes.includes(filters.size));
  }

  if (filters.sort === "low-to-high") {
    result.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "high-to-low") {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
}

export function getAvailableSizes(
  items: Product[],
  config: StoreConfig,
): string[] {
  const sizeSet = new Set<string>();
  items.forEach((p) => p.sizes.forEach((s) => sizeSet.add(s)));
  const order = config.sizes.standard;
  return Array.from(sizeSet).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
}

export function getNewestArrivals(items: Product[], limit = 5): Product[] {
  const drops = items.filter((p) => p.status === "new_drop" && !isProductUnavailable(p));
  if (drops.length > 0) return drops.slice(0, limit);

  const available = items.filter((p) => !isProductUnavailable(p));
  return (available.length > 0 ? available : items).slice(0, limit);
}

export function formatPrice(price: number, symbol = "₪"): string {
  return `${symbol}${price.toLocaleString("en-IL")}`;
}

export function formatPriceOrDm(price: number, symbol = "₪"): string {
  if (price <= 0) return "Contact for price";
  return formatPrice(price, symbol);
}
