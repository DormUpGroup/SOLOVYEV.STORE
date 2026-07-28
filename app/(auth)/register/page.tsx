"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/account/AuthCard";
import { useI18n } from "@/components/providers/I18nProvider";
import { createClient, hasSupabaseBrowserConfig } from "@/utils/supabase/client";
import { isValidPassword, normalizeEmail } from "@/lib/customer-auth";

export default function RegisterPage() {
  const router = useRouter();
  const { dict } = useI18n();
  const copy = dict.account;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const register = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!hasSupabaseBrowserConfig()) return setError(copy.configError);
    if (!isValidPassword(password)) return setError(copy.passwordRequirements);
    if (password !== confirmation) return setError(copy.passwordsMismatch);

    setBusy(true);
    const normalized = normalizeEmail(email);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalized, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || copy.configError);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/account");
      router.refresh();
    } catch {
      setError(copy.configError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title={copy.registerTitle} description={copy.registerHelp}>
      <form onSubmit={register} className="account-form">
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
        <label>
          {copy.password}
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          {copy.confirmPassword}
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <p className="account-form-hint">{copy.passwordRequirements}</p>
        {error ? <p className="account-error" role="alert">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? copy.wait : copy.registerButton}
        </button>
      </form>
      <p className="account-auth-switch">
        {copy.haveAccount} <Link href="/login">{copy.loginButton}</Link>
      </p>
    </AuthCard>
  );
}
