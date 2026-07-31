import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/utils/supabase/admin";
import { isValidPassword, normalizeEmail } from "@/lib/customer-auth";
import { setMarketingConsent } from "@/lib/marketing-consent";

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Customer accounts are not configured." }, { status: 503 });
  }

  let body: {
    email?: string;
    password?: string;
    marketingEmailOptIn?: boolean;
    locale?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const password = String(body.password ?? "");
  const marketingEmailOptIn = Boolean(body.marketingEmailOptIn);

  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Use at least 8 characters with a letter and a number." },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const message = /already|registered|exists/i.test(error.message)
      ? "An account with this email already exists."
      : "Registration failed. Try again later.";
    if (!/already|registered|exists/i.test(error.message)) {
      console.error("[POST /api/auth/register] createUser failed");
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = data.user?.id;
  if (userId && marketingEmailOptIn) {
    const consent = await setMarketingConsent({
      userId,
      granted: true,
      source: "registration",
      locale: body.locale,
    });
    if (consent.error) {
      console.error("[POST /api/auth/register] marketing consent failed:", consent.error);
    }
  }

  return NextResponse.json({ ok: true });
}
