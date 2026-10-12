import { NextResponse, type NextRequest } from "next/server";
import { fulfillGrowCallback } from "@/lib/grow/fulfill";
import { parseGrowCallbackBody } from "@/lib/grow/client";

async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const payload = parseGrowCallbackBody(rawBody, request.headers.get("content-type"));
  const orderKey = request.nextUrl.searchParams.get("order")?.trim();
  if (orderKey && !String(payload.cField1 ?? "").trim()) payload.cField1 = orderKey;

  try {
    const result = await fulfillGrowCallback(payload);
    if (!result.ok) {
      const status = result.error === "Payment not approved" ? 200 : 409;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, orderRef: result.orderRef });
  } catch (error) {
    console.error("Grow callback failed:", error);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}
