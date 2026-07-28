import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id,size,quantity")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    items?: Array<{ id?: number; product_id?: number; size?: string; quantity?: number }>;
  };
  if (!Array.isArray(body.items) || body.items.length > 50) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }
  const items = body.items.map((item) => ({
    user_id: user.id,
    product_id: Number(item.id ?? item.product_id),
    size: String(item.size ?? "").slice(0, 40),
    quantity: Number(item.quantity),
  }));
  if (items.some((item) => !Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
  }

  const { error: deleteError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  if (items.length) {
    const { error: insertError } = await supabase.from("cart_items").insert(items);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
