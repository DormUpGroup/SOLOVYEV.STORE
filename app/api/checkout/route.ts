import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/admin";
import { getConfig, getProducts } from "@/lib/data/store";
import { buildCartMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { CartItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json() as { items?: CartItem[] };
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }
  const items = body.items.map((item) => ({
    id: Number(item.id),
    product_id: Number(item.id),
    size: String(item.size ?? "").slice(0, 40),
    quantity: Number(item.quantity),
    qty: Number(item.quantity),
  }));
  if (items.some((item) => !Number.isInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
  }

  const config = await getConfig();
  const { data, error } = await supabase.rpc("create_whatsapp_order", {
    p_items: items.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
    p_currency_code: config.currency.code,
    p_currency_symbol: config.currency.symbol,
  });
  if (error || !data?.[0]) {
    return NextResponse.json({ error: error?.message || "Could not create order" }, { status: 400 });
  }

  const products = await getProducts();
  const order = data[0] as { order_id: string; order_ref: string; subtotal: number };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,phone,email")
    .eq("id", user.id)
    .maybeSingle();

  const message = buildCartMessage(
    items,
    products,
    process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store",
    config,
    order.order_ref,
    {
      displayName: profile?.display_name ?? null,
      phone: profile?.phone ?? null,
      email: profile?.email ?? user.email ?? null,
    },
  );
  const whatsappUrl = buildWhatsAppUrl(message, config);
  const customerPhone = profile?.phone?.trim() || null;

  try {
    const admin = createServiceClient();
    const { error: urlError } = await admin
      .from("orders")
      .update({
        whatsapp_url: whatsappUrl,
        customer_phone: customerPhone,
      })
      .eq("id", order.order_id);
    if (urlError) {
      console.error("Failed to persist whatsapp_url/customer_phone:", urlError.message);
    }
  } catch (persistError) {
    console.error("Failed to persist whatsapp_url/customer_phone:", persistError);
  }

  return NextResponse.json({
    orderId: order.order_id,
    orderRef: order.order_ref,
    subtotal: Number(order.subtotal),
    whatsappUrl,
  });
}
