import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminOrder, updateAdminOrderStatus } from "@/lib/admin/commerce";
import { isOrderStatus } from "@/lib/admin/commerce-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const order = await getAdminOrder(id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[GET /api/admin/orders/:id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    if (!isOrderStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const order = await updateAdminOrderStatus(id, body.status);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[PATCH /api/admin/orders/:id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update order" },
      { status: 500 },
    );
  }
}
