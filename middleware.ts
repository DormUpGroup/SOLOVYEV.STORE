import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminPath, verifyAdminJwt } from "@/lib/auth";
import { updateSession } from "@/utils/supabase/middleware";

const ADMIN_INTERNAL = "/admin-internal";

async function isAuthed(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminJwt(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPath = getAdminPath();

  if (pathname === "/admin" || pathname === "/admin.html" || pathname.startsWith("/admin/")) {
    return new NextResponse(null, { status: 404 });
  }

  const isSecretAdmin =
    pathname === `/${adminPath}` || pathname.startsWith(`/${adminPath}/`);
  const isAdminInternal =
    pathname === ADMIN_INTERNAL || pathname.startsWith(`${ADMIN_INTERNAL}/`);
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/login");
  const isMarketplaceLogin = pathname === "/marketplace/login";
  const isMarketplace =
    pathname === "/marketplace" || pathname.startsWith("/marketplace/");

  if (isSecretAdmin) {
    const rewritePath =
      pathname.replace(`/${adminPath}`, ADMIN_INTERNAL) || ADMIN_INTERNAL;
    const rewriteUrl = new URL(`${rewritePath}${request.nextUrl.search}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  if (isAdminInternal) {
    const authed = await isAuthed(request);
    if (!authed) {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (isAdminApi) {
    const authed = await isAuthed(request);
    if (!authed) {
      return new NextResponse(null, { status: 404 });
    }
  }


  // Marketplace demo: admin session required (login page stays public)
  if (isMarketplaceLogin) {
    const authed = await isAuthed(request);
    if (authed) {
      const next = request.nextUrl.searchParams.get("next");
      const target =
        next &&
        next.startsWith("/marketplace") &&
        !next.startsWith("//") &&
        !next.includes("://")
          ? next
          : "/marketplace";
      return NextResponse.redirect(new URL(target, request.url));
    }
  } else if (isMarketplace) {
    const authed = await isAuthed(request);
    if (!authed) {
      const loginUrl = new URL("/marketplace/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  const { response, user } = await updateSession(request);

  const needsCustomer =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/onboarding" ||
    pathname === "/welcome";

  if (needsCustomer && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    if (request.nextUrl.searchParams.get("checkout") === "1") {
      loginUrl.searchParams.set("checkout", "1");
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/admin.html",
    "/admin-internal",
    "/admin-internal/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
