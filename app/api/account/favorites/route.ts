import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("favorites").select("product_id").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favoriteIds: (data ?? []).map((row) => row.product_id) });
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await request.json() as { productId?: number };
  if (!Number.isInteger(productId) || Number(productId) <= 0) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await request.json() as { productId?: number };
  if (!Number.isInteger(productId)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
