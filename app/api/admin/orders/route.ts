import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAdminOrders } from "@/lib/admin/commerce";
import { isOrderStatus } from "@/lib/admin/commerce-types";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 25);
    const search = searchParams.get("search") ?? "";
    const statusParam = searchParams.get("status") ?? "";
    const status = isOrderStatus(statusParam) ? statusParam : "";
    const since = searchParams.get("since") ?? undefined;
    const result = await listAdminOrders({ page, limit, search, status, since });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 },
    );
  }
}
