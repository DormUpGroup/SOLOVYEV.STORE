import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/utils/supabase/admin";
import { isValidPassword, normalizeEmail } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Customer accounts are not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = normalizeEmail(body.email ?? "");
  const password = String(body.password ?? "");

  if (!email || !email.includes("@")) {
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
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id ?? null });
}
