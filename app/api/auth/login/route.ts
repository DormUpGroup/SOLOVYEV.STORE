import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getAdminPath,
  recordFailedLogin,
  setAdminCookie,
  sleep,
  verifyAdminCredentials,
} from "@/lib/auth";

function clientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}

function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("://") || path.includes("\\")) return fallback;
  // Allow marketplace demo and admin panel only
  const adminPath = `/${getAdminPath()}`;
  if (
    path === "/marketplace" ||
    path.startsWith("/marketplace/") ||
    path === adminPath ||
    path.startsWith(`${adminPath}/`)
  ) {
    return path;
  }
  return fallback;
}

async function parseCredentials(
  request: NextRequest,
): Promise<{ login: string; password: string; redirect: string | null }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      login?: string;
      password?: string;
      redirect?: string;
    };
    return {
      login: body.login ?? "",
      password: body.password ?? "",
      redirect: body.redirect ?? null,
    };
  }
  const formData = await request.formData();
  return {
    login: String(formData.get("login") ?? formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirect: formData.get("redirect")
      ? String(formData.get("redirect"))
      : null,
  };
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!checkRateLimit(ip)) {
    await sleep(600);
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { login, password, redirect } = await parseCredentials(request);
  const adminPath = getAdminPath();
  const defaultRedirect = `/${adminPath}`;
  const nextPath = safeRedirectPath(redirect, defaultRedirect);
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const valid = verifyAdminCredentials(login, password);

  if (!valid) {
    recordFailedLogin(ip);
    await sleep(600);
    if (isJson) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const errorTarget = nextPath.startsWith("/marketplace")
      ? `/marketplace/login?error=1&next=${encodeURIComponent(nextPath)}`
      : `/${adminPath}?login=1&error=1`;
    return NextResponse.redirect(new URL(errorTarget, request.url), 303);
  }

  if (isJson) {
    const response = NextResponse.json({ ok: true, redirect: nextPath });
    return setAdminCookie(response);
  }
  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  return setAdminCookie(response);
}
