export type GrowProcess = {
  processId: string;
  processToken: string;
  paymentUrl: string;
};

export type GrowCallbackData = {
  status?: string;
  statusCode?: string;
  sum?: string;
  cardSuffix?: string;
  transactionId?: string;
  processId?: string;
  processToken?: string;
  customFields?: Record<string, string>;
  cField1?: string;
  cField2?: string;
  [key: string]: unknown;
};

export type GrowCallbackPayload = {
  status?: string | number;
  err?: unknown;
  data?: GrowCallbackData;
} & GrowCallbackData;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function isGrowApiConfigured(): boolean {
  return Boolean(process.env.GROW_USER_ID?.trim() && process.env.GROW_PAGE_CODE?.trim());
}

export function isGrowConfigured(): boolean {
  return isGrowApiConfigured() || Boolean(process.env.MAKE_GROW_WEBHOOK_URL?.trim());
}

export function growNotifyUrl(orderId: string): string {
  const orderKey = encodeURIComponent(compactId(orderId));
  return `${siteOrigin()}/api/payments/grow/callback?order=${orderKey}`;
}

export function growApiBase(): string {
  return (
    process.env.GROW_API_BASE?.replace(/\/$/, "") ||
    "https://sandbox.meshulam.co.il/api/light/server/1.0"
  );
}

export function growPageCode(): string {
  return requiredEnv("GROW_PAGE_CODE");
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store").replace(/\/$/, "");
}

export function compactId(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "");
}

export function expandUuid(compact: string): string | null {
  const hex = compact.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function growFullName(value: string | null | undefined): string {
  const cleaned = String(value ?? "")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 4).join(" ");
  if (parts.length === 1) return `${parts[0]} Customer`;
  return "Store Customer";
}

export function israelPhoneLocal(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  let local = digits;
  if (local.startsWith("972")) local = `0${local.slice(3)}`;
  else if (!local.startsWith("0")) local = `0${local}`;
  if (!/^0[5][0-9]{8}$/.test(local)) return null;
  return local;
}

function growErrorMessage(payload: { err?: unknown; status?: unknown }): string {
  const err = payload.err;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const row = err as { message?: unknown };
    if (typeof row.message === "string" && row.message.trim()) return row.message;
  }
  return `Grow request failed (${String(payload.status ?? "unknown")})`;
}

function isGrowOk(status: unknown): boolean {
  return status === 1 || status === "1";
}

async function growPost(path: string, fields: Record<string, string>): Promise<Record<string, unknown>> {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value) body.append(key, value);
  }
  const response = await fetch(`${growApiBase()}${path}`, {
    method: "POST",
    body,
  });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) throw new Error(`Grow HTTP ${response.status}`);
  if (!response.ok || !isGrowOk(payload.status)) {
    throw new Error(growErrorMessage(payload));
  }
  return payload;
}

export async function createGrowPaymentProcess(input: {
  amount: number;
  orderRef: string;
  orderId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
}): Promise<GrowProcess> {
  const origin = siteOrigin();
  const orderKey = compactId(input.orderRef);
  const payload = await growPost("/createPaymentProcess", {
    pageCode: growPageCode(),
    userId: requiredEnv("GROW_USER_ID"),
    chargeType: "1",
    sum: input.amount.toFixed(2),
    description: `Order ${orderKey}`.slice(0, 80),
    successUrl: `${origin}/checkout/success?ref=${encodeURIComponent(input.orderRef)}`,
    cancelUrl: `${origin}/checkout?cancel=1`,
    notifyUrl: growNotifyUrl(input.orderId),
    maxPaymentNum: "12",
    "pageField[fullName]": growFullName(input.customerName),
    "pageField[phone]": input.customerPhone,
    "pageField[email]": input.customerEmail?.trim() || "",
    cField1: compactId(input.orderId),
    cField2: orderKey,
  });

  const data = (payload.data ?? {}) as Record<string, unknown>;
  const processId = String(data.processId ?? "").trim();
  const processToken = String(data.processToken ?? "").trim();
  const paymentUrl = String(data.url ?? "").trim();
  if (!processId || !processToken || !paymentUrl) {
    throw new Error("Grow did not return a payment page");
  }
  return { processId, processToken, paymentUrl };
}

export async function approveGrowTransaction(fields: Record<string, string>): Promise<void> {
  const body: Record<string, string> = {
    pageCode: growPageCode(),
    ...fields,
  };
  try {
    await growPost("/approveTransaction", body);
  } catch (error) {
    console.error("Grow approveTransaction failed:", error);
  }
}

function assignDeep(target: Record<string, unknown>, path: string[], value: string) {
  let cursor = target;
  for (let i = 0; i < path.length; i += 1) {
    const key = path[i];
    if (i === path.length - 1) {
      cursor[key] = value;
      return;
    }
    const next = cursor[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
}

export function parseGrowCallbackBody(rawBody: string, contentType: string | null): GrowCallbackPayload {
  const type = contentType?.toLowerCase() || "";
  if (type.includes("application/json")) {
    try {
      return JSON.parse(rawBody) as GrowCallbackPayload;
    } catch {
      return {};
    }
  }

  const params = new URLSearchParams(rawBody);
  if ([...params.keys()].length === 0) {
    try {
      return rawBody ? (JSON.parse(rawBody) as GrowCallbackPayload) : {};
    } catch {
      return {};
    }
  }

  const nested: Record<string, unknown> = {};
  for (const [key, value] of params.entries()) {
    const path = key.replace(/]/g, "").split("[");
    if (path.length === 1) nested[key] = value;
    else assignDeep(nested, path, value);
  }
  return nested as GrowCallbackPayload;
}

export function growCallbackData(payload: GrowCallbackPayload): GrowCallbackData {
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  return {
    ...payload,
    ...data,
    customFields: {
      ...(typeof data.customFields === "object" && data.customFields ? data.customFields : {}),
      cField1: String(data.customFields?.cField1 ?? payload.cField1 ?? data.cField1 ?? ""),
      cField2: String(data.customFields?.cField2 ?? payload.cField2 ?? data.cField2 ?? ""),
    },
  };
}

export function isGrowPaymentApproved(payload: GrowCallbackPayload): boolean {
  const data = growCallbackData(payload);
  const code = String(data.statusCode ?? "").trim();
  if (code) return code === "2";
  const status = String(data.status ?? payload.status ?? "");
  return status === "1" || status.includes("שולם");
}

export function flattenGrowCallback(payload: GrowCallbackPayload): Record<string, string> {
  const data = growCallbackData(payload);
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null || typeof value === "object") continue;
    fields[key] = String(value);
  }
  if (data.processId) fields.processId = String(data.processId);
  if (data.processToken) fields.processToken = String(data.processToken);
  if (data.transactionId) fields.transactionId = String(data.transactionId);
  return fields;
}
