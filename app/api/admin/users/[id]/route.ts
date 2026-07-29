import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminUser } from "@/lib/admin/commerce";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const user = await getAdminUser(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error("[GET /api/admin/users/:id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load user" },
      { status: 500 },
    );
  }
}
