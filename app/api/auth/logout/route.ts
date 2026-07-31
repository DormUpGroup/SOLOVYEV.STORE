import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, getAdminPath } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const adminPath = getAdminPath();
  const response = NextResponse.redirect(new URL(`/${adminPath}?login=1`, request.url), 303);
  return clearAdminCookie(response);
}
