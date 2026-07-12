import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticatedRequest } from "@/lib/auth";
import { createServiceClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  const admin = await isAdminAuthenticatedRequest(request);
  return NextResponse.json({ admin });
}

export async function POST(request: NextRequest) {
  try {
    if (await isAdminAuthenticatedRequest(request)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "admin" });
    }

    const body = (await request.json()) as {
      events?: Array<{ type: string; productId?: number }>;
    };
    const events = body.events ?? [];
    if (!events.length) return NextResponse.json({ ok: true });

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createServiceClient();
    const rows = events.slice(0, 20).map((e) => ({
      event_type: e.type,
      product_id: e.productId ?? null,
      metadata: {},
    }));

    const { error } = await supabase.from("analytics_events").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
