import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, getAdminPath } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const adminPath = getAdminPath();
  const response = NextResponse.redirect(new URL(`/${adminPath}?login=1`, request.url), 303);
  return clearAdminCookie(response);
}

export async function GET(request: NextRequest) {
  const adminPath = getAdminPath();
  const response = NextResponse.redirect(new URL(`/${adminPath}?login=1`, request.url), 303);
  return clearAdminCookie(response);
}
