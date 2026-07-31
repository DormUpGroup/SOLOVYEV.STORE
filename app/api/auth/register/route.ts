import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isValidPassword, normalizeEmail } from "@/lib/customer-auth";
import { setMarketingConsent } from "@/lib/marketing-consent";

const GENERIC_REGISTER_OK =
  "If this email can be registered, we sent a confirmation link. Check your inbox.";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store").replace(/\/$/, "");
}

function publishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    undefined
  );
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publishableKey();
  if (!url || !key) {
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

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    // Avoid account enumeration: same generic success for "already registered" cases.
    if (/already|registered|exists/i.test(error.message)) {
      return NextResponse.json({ ok: true, needsConfirmation: true, message: GENERIC_REGISTER_OK });
    }
    console.error("[POST /api/auth/register] signUp failed");
    return NextResponse.json({ error: "Registration failed. Try again later." }, { status: 400 });
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

  // Prefer confirmation flow: do not auto-issue a session for unverified emails.
  const needsConfirmation = !data.session;
  return NextResponse.json({
    ok: true,
    needsConfirmation,
    message: needsConfirmation
      ? GENERIC_REGISTER_OK
      : undefined,
  });
}
