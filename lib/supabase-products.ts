import type { Product, ProductCategory, ProductImage, ProductStatus } from "@/lib/types";
import { getSupabaseAdmin, hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase";
import { deleteImageUrl } from "@/lib/supabase-storage";
import { isBrandNewCondition } from "@/lib/products";
import { decodeCropSettings, encodeCropSettings } from "@/lib/image-crop";
import { uniqueSlugFromTitle } from "@/lib/slug";

type DbProduct = {
  id: number;
  slug: string;
  title: string;
  category: string;
  price: number;
  original_price: number | null;
  condition: string;
  brand: string;
  badge: string;
  sizes: string[];
  img: string;
  status: string;
  sold: boolean | null;
  description: string | null;
  instagram_url: string | null;
  source: string | null;
  sort_order: number;
  updated_at: string;
};

type DbProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  object_position: string;
};

const CATEGORIES: ProductCategory[] = ["sneakers", "clothing", "accessories"];
const STATUSES: ProductStatus[] = [
  "available",
  "reserved",
  "sold",
  "new_drop",
  "draft",
  "made_to_order",
  "brand_new",
];

const PUBLIC_CATALOG_STATUSES: ProductStatus[] = [
  "available",
  "reserved",
  "sold",
  "new_drop",
];

function mapImage(row: DbProductImage): ProductImage {
  const crop = decodeCropSettings(row.object_position);
  return {
    id: row.id,
    productId: row.product_id,
    imageUrl: row.image_url,
    altText: row.alt_text ?? undefined,
    sortOrder: row.sort_order,
    objectPosition: crop.objectPosition,
    cropZoom: crop.cropZoom,
    cropMode: crop.cropMode,
  };
}

function mapProduct(row: DbProduct, images: ProductImage[] = []): Product {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryImg = sorted[0]?.imageUrl ?? row.img ?? "";
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category as Product["category"],
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    condition: row.condition,
    brand: row.brand,
    badge: row.badge,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    img: primaryImg,
    images: sorted,
    status: row.status as Product["status"],
    sold: row.sold ?? undefined,
    description: row.description ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    source: (row.source as Product["source"]) ?? "instagram",
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

async function attachImages(products: DbProduct[]): Promise<Product[]> {
  if (!products.length) return [];
  const supabase = getSupabaseAdmin();
  const ids = products.map((p) => p.id);
  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", ids)
    .order("sort_order", { ascending: true });

  const byProduct = new Map<number, ProductImage[]>();
  for (const row of (images ?? []) as DbProductImage[]) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(mapImage(row));
    byProduct.set(row.product_id, list);
  }

  return products.map((row) => mapProduct(row, byProduct.get(row.id) ?? []));
}

export function productToDbRow(
  p: Omit<Partial<Product>, "originalPrice"> & {
    slug: string;
    title: string;
    originalPrice?: number | null;
  },
  primaryImg?: string,
) {
  const shortcode = p.instagramUrl?.match(/\/p\/([^/]+)/)?.[1] ?? null;
  const img = primaryImg ?? p.img ?? p.images?.[0]?.imageUrl ?? "";
  return {
    slug: p.slug,
    title: p.title,
    category: p.category ?? "sneakers",
    price: p.price ?? 0,
    original_price: p.originalPrice ?? null,
    condition: p.condition ?? "See description",
    brand: p.brand ?? "Streetwear",
    badge: p.badge ?? "hot",
    sizes: p.sizes ?? [],
    img,
    status: p.status ?? "available",
    sold: p.sold ?? false,
    description: p.description ?? null,
    instagram_url: p.instagramUrl ?? null,
    instagram_shortcode: shortcode,
    source: p.source ?? "admin",
    sort_order: p.sortOrder ?? 0,
  };
}

export function validateCategory(category: string): category is ProductCategory {
  return CATEGORIES.includes(category as ProductCategory);
}

export function validateStatus(status: string): status is ProductStatus {
  return STATUSES.includes(status as ProductStatus);
}

export async function fetchProductsForPublic(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("status", PUBLIC_CATALOG_STATUSES)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data?.length) return [];
  return attachImages(data as DbProduct[]);
}

export async function fetchNewProductsForHome(limit = 8): Promise<Product[]> {
  const products = await fetchProductsForPublic();
  return products.filter((p) => p.status === "new_drop").slice(0, limit);
}

export async function fetchMadeToOrderProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "made_to_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data?.length) return [];
  return attachImages(data as DbProduct[]);
}

export async function fetchBrandNewProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return [];

  const supabase = getSupabaseAdmin();
  const [byStatusResult, publicProducts] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("status", "brand_new")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    fetchProductsForPublic(),
  ]);

  const byStatus =
    byStatusResult.error || !byStatusResult.data?.length
      ? []
      : await attachImages(byStatusResult.data as DbProduct[]);
  const byCondition = publicProducts.filter((p) => isBrandNewCondition(p.condition));

  const seen = new Set<number>();
  const merged: Product[] = [];
  for (const product of [...byStatus, ...byCondition]) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    merged.push(product);
  }
  return merged;
}

export async function fetchProductsAdmin(): Promise<Product[]> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data) return [];
  return attachImages(data as DbProduct[]);
}

export async function fetchProductById(id: number): Promise<Product | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const [product] = await attachImages([data as DbProduct]);
  return product ?? null;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();
  if (error || !data) return null;
  const [product] = await attachImages([data as DbProduct]);
  return product ?? null;
}

export async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("products").select("id").eq("slug", slug);
  if (excludeId != null) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function resolveUniqueSlug(title: string, excludeId?: number): Promise<string> {
  return uniqueSlugFromTitle(title, (slug) => isSlugTaken(slug, excludeId));
}

export type CreateProductInput = {
  title: string;
  slug?: string;
  category: ProductCategory;
  brand: string;
  badge?: string;
  sizes?: string[];
  price?: number;
  originalPrice?: number | null;
  condition?: string;
  description?: string;
  status?: ProductStatus;
  sold?: boolean;
  instagramUrl?: string;
  sortOrder?: number;
  source?: Product["source"];
  images?: Array<{
    imageUrl: string;
    altText?: string;
    objectPosition?: string;
    cropZoom?: number;
    cropMode?: ProductImage["cropMode"];
  }>;
};

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const supabase = getSupabaseAdmin();
  const primaryImg = input.images?.[0]?.imageUrl ?? "";
  const slug = await resolveUniqueSlug(input.title);
  const row = productToDbRow(
    {
      title: input.title,
      slug,
      category: input.category,
      brand: input.brand,
      badge: input.badge,
      sizes: input.sizes,
      price: input.price,
      originalPrice: input.originalPrice,
      condition: input.condition,
      description: input.description,
      status: input.status,
      sold: input.sold,
      instagramUrl: input.instagramUrl,
      sortOrder: input.sortOrder,
      source: input.source,
    },
    primaryImg,
  );

  const { data, error } = await supabase.from("products").insert(row).select().single();
  if (error) {
    console.error("[createProduct] insert error:", JSON.stringify(error));
    throw error;
  }

  if (input.images?.length) {
    const imageRows = input.images.map((img, i) => ({
      product_id: data.id,
      image_url: img.imageUrl,
      alt_text: img.altText ?? input.title,
      sort_order: i,
      object_position: encodeCropSettings(
        img.objectPosition ?? "50% 50%",
        img.cropZoom ?? 1,
        img.cropMode ?? "cover",
      ),
    }));
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) {
      console.error("[createProduct] product_images insert error:", JSON.stringify(imgErr));
      await supabase.from("products").delete().eq("id", data.id);
      throw imgErr;
    }
  }

  const created = await fetchProductById(data.id);
  // If refetch fails, fall back to the data returned by insert
  return created ?? mapProduct(data as DbProduct, []);
}

export type UpdateProductInput = Partial<CreateProductInput> & {
  imageIds?: number[];
};

export async function updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
  const existing = await fetchProductById(id);
  if (!existing) throw new Error("Product not found");

  const title = input.title ?? existing.title;
  const slug = await resolveUniqueSlug(title, id);
  const merged = {
    slug,
    title,
    category: input.category ?? existing.category,
    brand: input.brand ?? existing.brand,
    badge: input.badge ?? existing.badge,
    sizes: input.sizes ?? existing.sizes,
    price: input.price ?? existing.price,
    originalPrice:
      "originalPrice" in input
        ? (input.originalPrice ?? undefined)
        : existing.originalPrice,
    condition: input.condition ?? existing.condition,
    description: input.description ?? existing.description,
    status: input.status ?? existing.status,
    sold: input.sold ?? existing.sold,
    instagramUrl: input.instagramUrl ?? existing.instagramUrl,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    source: existing.source,
  };

  const primaryImg =
    input.images?.[0]?.imageUrl ??
    (input.imageIds?.length
      ? existing.images?.find((img) => img.id === input.imageIds![0])?.imageUrl
      : undefined) ??
    existing.img;

  const row = productToDbRow(merged, primaryImg);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("products").update(row).eq("id", id);
  if (error) throw error;

  if (input.imageIds?.length) {
    await Promise.all(
      input.imageIds.map((imageId, index) =>
        supabase
          .from("product_images")
          .update({ sort_order: index })
          .eq("id", imageId)
          .eq("product_id", id),
      ),
    );
    await syncProductPrimaryImage(id);
  } else if (input.images?.length) {
    await syncProductPrimaryImage(id);
  }

  const updated = await fetchProductById(id);
  if (!updated) throw new Error("Failed to fetch updated product");
  return updated;
}

export async function deleteProduct(id: number): Promise<void> {
  const product = await fetchProductById(id);
  if (!product) return;

  const supabase = getSupabaseAdmin();
  const urls = (product.images ?? []).map((img) => img.imageUrl);
  if (product.img && !urls.includes(product.img)) urls.push(product.img);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  void deleteImageUrlsBestEffort(urls);
}

async function deleteImageUrlsBestEffort(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => deleteImageUrl(url)));
}

export async function reorderProducts(ids: number[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  await Promise.all(
    ids.map((id, index) =>
      supabase.from("products").update({ sort_order: index }).eq("id", id),
    ),
  );
}

async function syncProductPrimaryImage(productId: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  await supabase
    .from("products")
    .update({ img: data?.image_url ?? "" })
    .eq("id", productId);
}

export async function addProductImage(
  productId: number,
  imageUrl: string,
  opts?: {
    altText?: string;
    sortOrder?: number;
    objectPosition?: string;
    cropZoom?: number;
    cropMode?: ProductImage["cropMode"];
  },
): Promise<ProductImage> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.sort_order ?? -1;
  const sortOrder = opts?.sortOrder ?? maxOrder + 1;

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: imageUrl,
      alt_text: opts?.altText ?? null,
      sort_order: sortOrder,
      object_position: encodeCropSettings(
        opts?.objectPosition ?? "50% 50%",
        opts?.cropZoom ?? 1,
        opts?.cropMode ?? "cover",
      ),
    })
    .select()
    .single();

  if (error) throw error;

  await syncProductPrimaryImage(productId);

  return mapImage(data as DbProductImage);
}

export async function reorderProductImages(productId: number, imageIds: number[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  await Promise.all(
    imageIds.map((imageId, index) =>
      supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", imageId)
        .eq("product_id", productId),
    ),
  );

  await syncProductPrimaryImage(productId);
}

export async function updateProductImageCrop(
  productId: number,
  imageId: number,
  objectPosition: string,
  cropZoom: number,
  cropMode: ProductImage["cropMode"] = "free",
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("product_images")
    .update({ object_position: encodeCropSettings(objectPosition, cropZoom, cropMode) })
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) throw error;
}

export async function updateProductImageUrl(
  productId: number,
  imageId: number,
  imageUrl: string,
): Promise<ProductImage> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_images")
    .update({ image_url: imageUrl })
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("*")
    .single();
  if (error) throw error;

  await syncProductPrimaryImage(productId);
  return mapImage(data as DbProductImage);
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) throw error;

  if (data?.image_url) {
    void deleteImageUrl(data.image_url);
  }

  await syncProductPrimaryImage(productId);
}

export async function getProductImageUrls(productId: number): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("product_id", productId);
  return (data ?? []).map((row) => row.image_url as string);
}
