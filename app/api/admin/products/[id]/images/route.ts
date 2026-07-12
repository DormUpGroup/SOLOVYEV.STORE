import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import {
  addProductImage,
  fetchProductById,
  reorderProductImages,
} from "@/lib/supabase-products";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = Number(id);
  const body = (await request.json()) as {
    imageUrl?: string;
    altText?: string;
    sortOrder?: number;
    objectPosition?: string;
  };

  if (!body.imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  const product = await fetchProductById(productId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const image = await addProductImage(productId, body.imageUrl, {
    altText: body.altText,
    sortOrder: body.sortOrder,
    objectPosition: body.objectPosition,
  });

  revalidateStore();
  const updated = await fetchProductById(productId);
  return NextResponse.json({ image, product: updated }, { status: 201 });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = Number(id);
  const body = (await request.json()) as { imageIds?: number[] };

  if (!body.imageIds?.length) {
    return NextResponse.json({ error: "imageIds required" }, { status: 400 });
  }

  await reorderProductImages(productId, body.imageIds);
  revalidateStore();
  const product = await fetchProductById(productId);
  return NextResponse.json({ product });
}
