import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/admin";

const ALLOWED_EVENT_TYPES = new Set([
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "sell_trade_submit",
]);

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

  if (origin) {
    try {
      const configured = process.env.NEXT_PUBLIC_SITE_URL || "";
      if (configured) {
        return new URL(origin).origin === new URL(configured).origin;
      }
      const host = new URL(origin).hostname;
      return host === "localhost" || host === "127.0.0.1";
    } catch {
      return false;
    }
  }

  // Browsers send Sec-Fetch-Site on same-origin POST; non-browser clients usually omit both.
  return site === "same-origin" || site === "same-site";
}

/** Admin skip check moved client-side; no session oracle. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      events?: Array<{ type: string; productId?: number }>;
    };
    const events = Array.isArray(body.events) ? body.events.slice(0, 20) : [];
    if (!events.length) return NextResponse.json({ ok: true });

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const rows = events
      .map((e) => {
        const type = String(e?.type ?? "");
        if (!ALLOWED_EVENT_TYPES.has(type)) return null;
        const productId =
          e.productId != null && Number.isFinite(Number(e.productId))
            ? Math.trunc(Number(e.productId))
            : null;
        return {
          event_type: type,
          product_id: productId,
          metadata: {},
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (!rows.length) return NextResponse.json({ ok: true });

    const supabase = createServiceClient();
    const { error } = await supabase.from("analytics_events").insert(rows);
    if (error) {
      console.error("[POST /api/analytics] insert failed");
      return NextResponse.json({ error: "Failed to record events" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
