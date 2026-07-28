"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/account/AuthCard";
import { useI18n } from "@/components/providers/I18nProvider";
import { createClient, hasSupabaseBrowserConfig } from "@/utils/supabase/client";
import { normalizeEmail } from "@/lib/customer-auth";

export default function ForgotPasswordPage() {
  const { dict } = useI18n();
  const copy = dict.account;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const sendRecovery = async (event: FormEvent) => {
    event.preventDefault();
    if (!hasSupabaseBrowserConfig()) return setError(copy.configError);
    setBusy(true);
    setError("");
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthCard title={copy.forgotTitle} description={copy.forgotHelp}>
      {sent ? (
        <div className="account-auth-result">
          <p className="account-success" role="status">{copy.resetSent}</p>
          <Link href="/login" className="btn-secondary">{copy.backToLogin}</Link>
        </div>
      ) : (
        <form onSubmit={sendRecovery} className="account-form">
          <label>
            {copy.email}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          {error ? <p className="account-error" role="alert">{error}</p> : null}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? copy.wait : copy.sendResetLink}
          </button>
          <Link href="/login" className="account-auth-link">{copy.backToLogin}</Link>
        </form>
      )}
    </AuthCard>
  );
}
