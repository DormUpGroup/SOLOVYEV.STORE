import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

/** Secret admin URL segment. No hardcoded production path — set ADMIN_PATH. */
export function getAdminPath(): string {
  const path = process.env.ADMIN_PATH?.trim().replace(/^\/+|\/+$/g, "");
  if (path) return path;
  if (process.env.NODE_ENV === "production") {
    // Fail closed: never expose a guessable default in production.
    return "__admin_path_not_configured__";
  }
  return "admin-dev-local";
}

/**
 * Constant-time string compare that does not early-return on length mismatch.
 * Length still influences loop bound slightly; avoids trivial length oracle.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const len = Math.max(aBytes.length, bBytes.length, 1);
  let result = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const x = i < aBytes.length ? aBytes[i]! : 0;
    const y = i < bBytes.length ? bBytes[i]! : 0;
    result |= x ^ y;
  }
  return result === 0;
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET is required in production (min 16 characters)",
    );
  }
  return "dev-insecure-secret-change-me!!";
}

function base64UrlEncode(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

interface JwtPayload {
  iat: number;
  exp: number;
  role: "admin";
}

export async function signAdminJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = { iat: now, exp: now + SESSION_TTL_SEC, role: "admin" };
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await importKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64UrlEncode(sig)}`;
}

export async function verifyAdminJwt(token: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [header, body, sig] = parts as [string, string, string];
    const data = `${header}.${body}`;
    const key = await importKey();
    const sigBytes = new Uint8Array(base64UrlDecode(sig));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data),
    );
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as JwtPayload;
    if (payload.role !== "admin") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(login: string, password: string): boolean {
  const expectedLogin = process.env.ADMIN_LOGIN;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedLogin || !expectedPassword) {
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] ADMIN_LOGIN and ADMIN_PASSWORD are required in production");
    }
    return false;
  }
  return constantTimeEqual(login, expectedLogin) && constantTimeEqual(password, expectedPassword);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminJwt(token);
}

export function isAdminAuthenticatedRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return Promise.resolve(false);
  return verifyAdminJwt(token);
}

export async function setAdminCookie(response: NextResponse): Promise<NextResponse> {
  const token = await signAdminJwt();
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
  return response;
}

export function clearAdminCookie(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Process-local rate limit. Ineffective across serverless isolates —
 * use edge/WAF rate limiting in production. Kept as a soft local guard only.
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  return entry.count < 5;
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return;
  }
  entry.count++;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
