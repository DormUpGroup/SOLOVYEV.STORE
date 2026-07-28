"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient, hasSupabaseBrowserConfig } from "@/utils/supabase/client";
import { useI18n } from "@/components/providers/I18nProvider";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function LoginForm() {
  const router = useRouter();
  const { dict } = useI18n();
  const copy = dict.account;
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const configured = hasSupabaseBrowserConfig();

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!configured) return setError(copy.configError);
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (otpError) return setError(otpError.message);
    setStep("code");
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.replace(/\D/g, ""),
      type: "email",
    });
    setBusy(false);
    if (verifyError) return setError(verifyError.message);
    router.replace(safeNext(params.get("next")));
    router.refresh();
  };

  return (
    <main className="account-auth-shell">
      <section className="account-auth-card">
        <Link href="/" className="account-auth-logo">SOLOVYEV<span>.STORE</span></Link>
        <p className="account-eyebrow">PERSONAL ACCOUNT</p>
        <h1>{step === "email" ? copy.signIn : copy.enterCode}</h1>
        <p className="account-muted">
          {step === "email"
            ? copy.emailHelp
            : `${copy.sentTo} ${email}.`}
        </p>

        <form onSubmit={step === "email" ? sendCode : verifyCode} className="account-form">
          {step === "email" ? (
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
          ) : (
            <label>
              {copy.code}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="account-otp-input"
              />
            </label>
          )}
          {error ? <p className="account-error" role="alert">{error}</p> : null}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? copy.wait : step === "email" ? copy.sendCode : copy.verify}
          </button>
          {step === "code" ? (
            <button type="button" className="btn-secondary" onClick={() => { setStep("email"); setCode(""); setError(""); }}>
              {copy.changeEmail}
            </button>
          ) : null}
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
