import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { safeAuthNext } from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(safeAuthNext(url.searchParams.get("next")), url),
      );
    }
  }
  const isRecovery = url.searchParams.get("next") === "/reset-password";
  const destination = new URL(isRecovery ? "/forgot-password" : "/login", url);
  destination.searchParams.set("error", "auth_callback");
  return NextResponse.redirect(destination);
}
