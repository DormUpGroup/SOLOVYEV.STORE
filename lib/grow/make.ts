import {
  compactId,
  growFullName,
  growNotifyUrl,
  siteOrigin,
  type GrowProcess,
} from "@/lib/grow/client";

const MAKE_TIMEOUT_MS = 25_000;

export function isMakeGrowConfigured(): boolean {
  return Boolean(process.env.MAKE_GROW_WEBHOOK_URL?.trim());
}

function makeWebhookUrl(): string {
  const url = process.env.MAKE_GROW_WEBHOOK_URL?.trim();
  if (!url) throw new Error("MAKE_GROW_WEBHOOK_URL is not configured");
  return url;
}

function makeHeaders(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  const secret = process.env.MAKE_GROW_SECRET?.trim();
  if (secret) headers.set("x-grow-webhook-secret", secret);
  return headers;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(sources: unknown[], keys: string[]): string {
  for (const source of sources) {
    const row = asRecord(source);
    if (!row) continue;
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

async function postMake(body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(makeWebhookUrl(), {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(MAKE_TIMEOUT_MS),
  });
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = pickString([payload], ["error", "message"]) || text.slice(0, 180);
    throw new Error(message || `Make HTTP ${response.status}`);
  }
  return payload ?? text;
}

export async function createMakePaymentLink(input: {
  amount: number;
  orderRef: string;
  orderId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
}): Promise<GrowProcess> {
  const origin = siteOrigin();
  const orderKey = compactId(input.orderRef);
  const title = `Order ${orderKey}`.slice(0, 80);
  const price = input.amount.toFixed(2);
  const payload = await postMake({
    action: "create",
    sendingMode: "none",
    fullName: growFullName(input.customerName),
    phone: input.customerPhone,
    email: input.customerEmail?.trim() || "",
    chargeType: "regular",
    successUrl: `${origin}/checkout/success?ref=${encodeURIComponent(input.orderRef)}`,
    cancelUrl: `${origin}/checkout?cancel=1`,
    notifyUrl: growNotifyUrl(input.orderId),
    title,
    paymentType: "payments",
    vatType: "exempt",
    productName: title,
    productPrice: price,
    productQuantity: "1",
    sum: price,
    orderId: compactId(input.orderId),
    orderRef: input.orderRef,
  });

  const sources = [payload, asRecord(payload)?.data, asRecord(payload)?.body];
  const paymentUrl = pickString(sources, ["paymentUrl", "url", "paymentLinkUrl", "link", "payment_url"]);
  const processId = pickString(sources, ["processId", "process_id", "paymentLinkId", "id"]) || compactId(input.orderId);
  const processToken = pickString(sources, ["processToken", "process_token", "token"]);
  if (!paymentUrl.startsWith("https://")) {
    throw new Error("Make did not return a Grow payment page");
  }
  return { processId, processToken, paymentUrl };
}

export async function approveMakeGrowTransaction(fields: Record<string, string>): Promise<void> {
  if (!isMakeGrowConfigured()) return;
  try {
    await postMake({ action: "approve", ...fields });
  } catch (error) {
    console.error("Make approve transaction failed:", error);
  }
}
