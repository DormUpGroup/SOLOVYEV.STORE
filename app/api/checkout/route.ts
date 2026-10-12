import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/admin";
import { getConfig } from "@/lib/data/store";
import { normalizeCheckoutItems } from "@/lib/checkout/cart";
import {
  isShippingMethod,
  shippingAmountFor,
  orderChargeAmount,
} from "@/lib/checkout/shipping";
import {
  createGrowPaymentProcess,
  growFullName,
  isGrowApiConfigured,
  isGrowConfigured,
  israelPhoneLocal,
} from "@/lib/grow/client";
import { createMakePaymentLink } from "@/lib/grow/make";

export async function POST(request: NextRequest) {
  if (!isGrowConfigured()) {
    return NextResponse.json(
      { error: "Card payments are not configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json() as {
    items?: unknown;
    shippingMethod?: unknown;
    fullName?: unknown;
    phone?: unknown;
  };
  const items = normalizeCheckoutItems(body.items);
  if (!items) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  if (!isShippingMethod(body.shippingMethod)) {
    return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,phone,email")
    .eq("id", user.id)
    .maybeSingle();

  const customerName = growFullName(
    (typeof body.fullName === "string" && body.fullName.trim()) ||
      profile?.display_name ||
      user.email,
  );
  const customerPhone = israelPhoneLocal(
    (typeof body.phone === "string" && body.phone) || profile?.phone,
  );
  if (!customerPhone) {
    return NextResponse.json({ error: "Israeli mobile phone required" }, { status: 400 });
  }

  const config = await getConfig();
  const { data, error } = await supabase.rpc("create_whatsapp_order", {
    p_items: items.map(({ id, size, quantity }) => ({ product_id: id, size, quantity })),
    p_currency_code: config.currency.code,
    p_currency_symbol: config.currency.symbol,
    p_shipping_method: body.shippingMethod,
    p_shipping_amount: 0,
  });
  if (error || !data?.[0]) {
    return NextResponse.json({ error: error?.message || "Could not create order" }, { status: 400 });
  }

  const order = data[0] as {
    order_id: string;
    order_ref: string;
    subtotal: number;
  };
  const productSubtotal = Number(order.subtotal);
  const shippingAmount = shippingAmountFor(body.shippingMethod, productSubtotal);
  const chargeAmount = orderChargeAmount(productSubtotal, shippingAmount);

  const admin = createServiceClient();
  const { error: shippingError } = await admin
    .from("orders")
    .update({
      shipping_method: body.shippingMethod,
      shipping_amount: shippingAmount,
      customer_phone: customerPhone,
    })
    .eq("id", order.order_id);
  if (shippingError) {
    return NextResponse.json({ error: shippingError.message }, { status: 500 });
  }

  let session;
  try {
    const paymentInput = {
      amount: chargeAmount,
      orderRef: order.order_ref,
      orderId: order.order_id,
      customerName,
      customerEmail: profile?.email ?? user.email,
      customerPhone,
    };
    session = isGrowApiConfigured()
      ? await createGrowPaymentProcess(paymentInput)
      : await createMakePaymentLink(paymentInput);
  } catch (growError) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.order_id);
    const message = growError instanceof Error ? growError.message : "Payment session failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { error: sessionError } = await admin
    .from("orders")
    .update({
      grow_process_id: session.processId,
      grow_process_token: session.processToken || null,
      grow_status: "pending",
    })
    .eq("id", order.order_id);
  if (sessionError) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.order_id);
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.order_id,
    orderRef: order.order_ref,
    subtotal: productSubtotal,
    shippingAmount,
    amount: chargeAmount,
    paymentUrl: session.paymentUrl,
  });
}
