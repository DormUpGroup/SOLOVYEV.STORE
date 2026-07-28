"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient, hasSupabaseBrowserConfig } from "@/utils/supabase/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { AuthCard } from "@/components/account/AuthCard";
import {
  buildAuthQuery,
  isCheckoutIntent,
  normalizeEmail,
  postAuthPath,
} from "@/lib/customer-auth";

function LoginForm() {
  const router = useRouter();
  const { dict } = useI18n();
  const copy = dict.account;
  const params = useSearchParams();
  const checkout = isCheckoutIntent(params.get("checkout"));
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() =>
    params.get("error") ? copy.invalidResetLink : "",
  );
  const message = params.get("reset") === "success" ? copy.resetSuccess : "";
  const configured = hasSupabaseBrowserConfig();

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!configured) return setError(copy.configError);
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (signInError) {
      setBusy(false);
      return setError(copy.invalidCredentials);
    }

    const accountResponse = await fetch("/api/account");
    const account = accountResponse.ok
      ? ((await accountResponse.json()) as { profile?: { display_name?: string | null } })
      : null;
    const hasDisplayName = Boolean(account?.profile?.display_name?.trim());
    setBusy(false);
    router.replace(postAuthPath({ hasDisplayName, checkout, next }));
    router.refresh();
  };

  return (
    <AuthCard title={copy.signIn} description={copy.signInHelp}>
      <form onSubmit={signIn} className="account-form">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="account-error" role="alert">{error}</p> : null}
        {message ? <p className="account-success" role="status">{message}</p> : null}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? copy.wait : copy.loginButton}
        </button>
        <Link href="/forgot-password" className="account-auth-link">
          {copy.forgotPassword}
        </Link>
      </form>
      <p className="account-auth-switch">
        {copy.noAccount}{" "}
        <Link href={`/register${buildAuthQuery({ next, checkout })}`}>
          {copy.createAccount}
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
