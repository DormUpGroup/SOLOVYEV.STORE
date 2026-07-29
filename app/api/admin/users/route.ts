import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAdminUsers } from "@/lib/admin/commerce";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 25);
    const search = searchParams.get("search") ?? "";
    const hasOrders = searchParams.get("hasOrders") === "1";
    const result = await listAdminUsers({ page, limit, search, hasOrders });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load users" },
      { status: 500 },
    );
  }
}
