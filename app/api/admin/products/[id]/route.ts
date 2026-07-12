import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import {
  deleteProduct,
  fetchProductById,
  isSlugTaken,
  updateProduct,
  validateCategory,
  validateStatus,
} from "@/lib/supabase-products";
import type { ProductCategory, ProductStatus } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

type PutBody = {
  title?: string;
  slug?: string;
  category?: ProductCategory;
  brand?: string;
  badge?: string;
  sizes?: string[];
  price?: number;
  originalPrice?: number;
  condition?: string;
  description?: string;
  status?: ProductStatus;
  sold?: boolean;
  instagramUrl?: string;
  sortOrder?: number;
  images?: Array<{ imageUrl: string; altText?: string; objectPosition?: string }>;
  imageIds?: number[];
};

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const product = await fetchProductById(Number(id));
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = Number(id);
  const body = (await request.json()) as PutBody;

  if (body.slug && (await isSlugTaken(body.slug, productId))) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }
  if (body.category && !validateCategory(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (body.status && !validateStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let product;
  try {
    product = await updateProduct(productId, body);
  } catch (err) {
    console.error("[PUT /api/admin/products/:id] updateProduct failed:", JSON.stringify(err));
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    revalidateStore(product.slug);
  } catch (err) {
    console.warn("[PUT /api/admin/products/:id] revalidateStore failed (non-fatal):", err);
  }

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let slug: string | undefined;
  try {
    const existing = await fetchProductById(Number(id));
    slug = existing?.slug;
    await deleteProduct(Number(id));
  } catch (err) {
    console.error("[DELETE /api/admin/products/:id] deleteProduct failed:", JSON.stringify(err));
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    revalidateStore(slug);
  } catch (err) {
    console.warn("[DELETE /api/admin/products/:id] revalidateStore failed (non-fatal):", err);
  }

  return NextResponse.json({ ok: true });
}
