import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import {
  createProduct,
  fetchProductsAdmin,
  isSlugTaken,
  validateCategory,
  validateStatus,
} from "@/lib/supabase-products";
import type { ProductCategory, ProductStatus } from "@/lib/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const products = await fetchProductsAdmin();
  return NextResponse.json({ products });
}

type PostBody = {
  title: string;
  slug: string;
  category: ProductCategory;
  brand: string;
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
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PostBody;
  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: "Title and slug required" }, { status: 400 });
  }
  if (!validateCategory(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (body.status && !validateStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (await isSlugTaken(body.slug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  try {
    const product = await createProduct({ ...body, source: "admin" });
    revalidateStore(product.slug);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
