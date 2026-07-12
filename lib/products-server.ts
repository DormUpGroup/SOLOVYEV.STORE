import { unstable_cache } from "next/cache";
import productsData from "@/data/products.json";
import type { Product } from "@/lib/types";
import { isBrandNewProduct } from "@/lib/products";
import { fetchProductsForPublic, fetchProductBySlug, fetchMadeToOrderProducts, fetchBrandNewProducts } from "@/lib/supabase-products";
import { isSupabaseConfigured, hasSupabaseServiceRole } from "@/lib/supabase";

export const STORE_TAG = "store";

function jsonFallbackProducts(): Product[] {
  return (productsData as Product[]).filter((p) => p.source === "instagram");
}

async function fetchProductsCached(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return jsonFallbackProducts();
  }
  const products = await fetchProductsForPublic();
  return products.length ? products : jsonFallbackProducts();
}

export const getProducts = unstable_cache(fetchProductsCached, ["store-products"], {
  tags: [STORE_TAG],
  revalidate: 300,
});

export const getMadeToOrderProducts = unstable_cache(
  async () => {
    if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return [];
    return fetchMadeToOrderProducts();
  },
  ["store-made-to-order"],
  { tags: [STORE_TAG], revalidate: 300 },
);

function jsonFallbackBrandNewProducts(): Product[] {
  return (productsData as Product[])
    .filter((p) => p.source === "instagram")
    .filter(isBrandNewProduct);
}

export const getBrandNewProducts = unstable_cache(
  async () => {
    if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
      return jsonFallbackBrandNewProducts();
    }
    const products = await fetchBrandNewProducts();
    return products.length ? products : jsonFallbackBrandNewProducts();
  },
  ["store-brand-new"],
  { tags: [STORE_TAG], revalidate: 300 },
);

export async function getProductBySlugFromStore(slug: string): Promise<Product | undefined> {
  if (isSupabaseConfigured() && hasSupabaseServiceRole()) {
    const product = await fetchProductBySlug(slug);
    if (product) return product;
  }
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}
