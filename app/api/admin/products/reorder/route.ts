import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import { reorderProducts } from "@/lib/supabase-products";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { ids?: string[] };
  if (!body.ids?.length) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  const ids = body.ids.map(Number).filter((id) => !Number.isNaN(id));
  await reorderProducts(ids);
  revalidateStore();
  return NextResponse.json({ ok: true });
}
