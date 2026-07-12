import brandLogosData from "@/data/brand-logos.json";
import type {
  ActiveFilters,
  Product,
  ProductStatus,
  StoreConfig,
} from "./types";

export const brandLogos = brandLogosData as Record<string, string>;

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
  if (product.source === "instagram" && product.status === "available") {
    return false;
  }
  return !product.sizes || product.sizes.length === 0;
}

export function getStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    available: "",
    new_drop: "NEW DROP",
    reserved: "RESERVED",
    sold: "SOLD",
    draft: "DRAFT",
    made_to_order: "MADE TO ORDER",
    brand_new: "BRAND NEW",
  };
  return labels[status];
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
  return brandLogos[slug] || `/assets/brands/${slug}.svg`;
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
