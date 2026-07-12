import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import {
  deleteProductImage,
  fetchProductById,
  updateProductImagePosition,
} from "@/lib/supabase-products";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, imageId } = await context.params;
  const body = (await request.json()) as { objectPosition?: string };

  if (!body.objectPosition) {
    return NextResponse.json({ error: "objectPosition required" }, { status: 400 });
  }

  await updateProductImagePosition(Number(id), Number(imageId), body.objectPosition);
  const product = await fetchProductById(Number(id));
  revalidateStore(product?.slug);
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, imageId } = await context.params;
  const existing = await fetchProductById(Number(id));
  await deleteProductImage(Number(id), Number(imageId));
  revalidateStore(existing?.slug);
  const product = await fetchProductById(Number(id));
  return NextResponse.json({ product });
}
