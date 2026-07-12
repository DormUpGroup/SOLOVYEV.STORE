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

  try {
    const product = await updateProduct(productId, body);
    revalidateStore();
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await deleteProduct(Number(id));
    revalidateStore();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
