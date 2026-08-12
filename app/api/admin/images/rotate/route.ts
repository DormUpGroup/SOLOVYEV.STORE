import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { isRotateDegrees, rotateImageAtUrl } from "@/lib/rotate-product-image";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { imageUrl?: string; degrees?: number };

  if (!body.imageUrl || typeof body.imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }
  if (!isRotateDegrees(body.degrees)) {
    return NextResponse.json(
      { error: "degrees must be 90, -90, 180, or 270" },
      { status: 400 },
    );
  }

  try {
    const url = await rotateImageAtUrl(body.imageUrl, body.degrees);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rotate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
