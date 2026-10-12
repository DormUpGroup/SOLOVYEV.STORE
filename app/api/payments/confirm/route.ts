import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { confirmGrowOrder } from "@/lib/grow/fulfill";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json() as { orderRef?: string };
  const orderRef = body.orderRef?.trim();
  if (!orderRef) {
    return NextResponse.json({ error: "Missing order" }, { status: 400 });
  }

  try {
    const result = await confirmGrowOrder(orderRef, { expectedUserId: user.id });
    if (result.ok) return NextResponse.json({ ok: true, orderRef: result.orderRef });
    if (result.pending) {
      return NextResponse.json({ ok: false, pending: true, orderRef: result.orderRef }, { status: 202 });
    }
    return NextResponse.json({ error: result.error || "Payment not confirmed" }, { status: 409 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment not confirmed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
