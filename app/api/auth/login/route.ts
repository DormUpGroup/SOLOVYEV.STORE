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
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function parseCredentials(request: NextRequest): Promise<{ login: string; password: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { login?: string; password?: string };
    return { login: body.login ?? "", password: body.password ?? "" };
  }
  const formData = await request.formData();
  return {
    login: String(formData.get("login") ?? formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!checkRateLimit(ip)) {
    await sleep(600);
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { login, password } = await parseCredentials(request);
  const valid = verifyAdminCredentials(login, password);

  if (!valid) {
    recordFailedLogin(ip);
    await sleep(600);
    const adminPath = getAdminPath();
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/${adminPath}?login=1&error=1`, request.url), 303);
  }

  const adminPath = getAdminPath();
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const response = NextResponse.json({ ok: true });
    return setAdminCookie(response);
  }
  const response = NextResponse.redirect(new URL(`/${adminPath}`, request.url), 303);
  return setAdminCookie(response);
}
