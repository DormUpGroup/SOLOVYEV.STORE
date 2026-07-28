import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileResult, favoritesResult, cartResult, ordersResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("favorites").select("product_id").order("created_at", { ascending: false }),
    supabase.from("cart_items").select("product_id,size,quantity").order("created_at"),
    supabase
      .from("orders")
      .select("id,order_ref,status,currency_code,currency_symbol,subtotal,created_at,order_items(*)")
      .order("created_at", { ascending: false }),
  ]);

  const error = profileResult.error || favoritesResult.error || cartResult.error || ordersResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    user: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profileResult.data,
    favoriteIds: (favoritesResult.data ?? []).map((row) => row.product_id),
    cart: cartResult.data ?? [],
    orders: ordersResult.data ?? [],
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { displayName?: string; phone?: string };
  const updates: { display_name?: string | null; phone?: string | null } = {};
  if ("displayName" in body) {
    updates.display_name = body.displayName?.trim().slice(0, 80) || null;
  }
  if ("phone" in body) {
    updates.phone = body.phone?.trim().slice(0, 30) || null;
  }
  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
