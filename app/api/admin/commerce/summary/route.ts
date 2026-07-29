import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCommerceSummary } from "@/lib/admin/commerce";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") ?? 7);
    const summary = await getCommerceSummary(days);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[GET /api/admin/commerce/summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load summary" },
      { status: 500 },
    );
  }
}
