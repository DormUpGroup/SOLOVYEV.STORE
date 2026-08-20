import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore, shouldDeferRevalidate } from "@/lib/admin-api";
import { isRotateDegrees, rotateImageAtUrl } from "@/lib/rotate-product-image";
import {
  deleteProductImage,
  fetchProductById,
  updateProductImageCrop,
  updateProductImageUrl,
} from "@/lib/supabase-products";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, imageId } = await context.params;
  const productId = Number(id);
  const imgId = Number(imageId);
  const defer = shouldDeferRevalidate(request);
  const body = (await request.json()) as {
    objectPosition?: string;
    cropZoom?: number;
    cropMode?: "cover" | "free";
    rotate?: number;
  };

  if (isRotateDegrees(body.rotate)) {
    const product = await fetchProductById(productId);
    const existing = product?.images?.find((img) => img.id === imgId);
    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    try {
      const newUrl = await rotateImageAtUrl(existing.imageUrl, body.rotate);
      const image = await updateProductImageUrl(productId, imgId, newUrl);
      const updated = defer ? null : await fetchProductById(productId);
      if (!defer) revalidateStore(updated?.slug);
      return NextResponse.json({ product: updated, image });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rotate failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!body.objectPosition || body.cropZoom == null) {
    return NextResponse.json(
      { error: "objectPosition and cropZoom, or rotate required" },
      { status: 400 },
    );
  }

  const cropZoom = Math.max(0.5, Math.min(3, Number(body.cropZoom)));
  if (!Number.isFinite(cropZoom)) {
    return NextResponse.json({ error: "Invalid cropZoom" }, { status: 400 });
  }

  await updateProductImageCrop(
    productId,
    imgId,
    body.objectPosition,
    cropZoom,
    body.cropMode === "cover" ? "cover" : "free",
  );
  const product = defer ? null : await fetchProductById(productId);
  if (!defer) revalidateStore(product?.slug);
  return NextResponse.json({ product });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, imageId } = await context.params;
  const defer = shouldDeferRevalidate(request);
  const existing = await fetchProductById(Number(id));
  await deleteProductImage(Number(id), Number(imageId));
  if (!defer) revalidateStore(existing?.slug);
  const product = defer ? null : await fetchProductById(Number(id));
  return NextResponse.json({ product });
}
