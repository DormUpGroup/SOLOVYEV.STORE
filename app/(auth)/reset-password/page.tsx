"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/account/AuthCard";
import { useI18n } from "@/components/providers/I18nProvider";
import { createClient, hasSupabaseBrowserConfig } from "@/utils/supabase/client";
import { isValidPassword } from "@/lib/customer-auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { dict } = useI18n();
  const copy = dict.account;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) {
      setError(copy.configError);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) setError(copy.invalidResetLink);
      else setReady(true);
    });
  }, [copy.configError, copy.invalidResetLink]);

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!isValidPassword(password)) return setError(copy.passwordRequirements);
    if (password !== confirmation) return setError(copy.passwordsMismatch);

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      return setError(updateError.message);
    }
    await supabase.auth.signOut();
    router.replace("/login?reset=success");
    router.refresh();
  };

  return (
    <AuthCard title={copy.resetTitle} description={copy.resetHelp}>
      {error && !ready ? (
        <div className="account-auth-result">
          <p className="account-error" role="alert">{error}</p>
          <Link href="/forgot-password" className="btn-secondary">{copy.forgotPassword}</Link>
        </div>
      ) : (
        <form onSubmit={updatePassword} className="account-form">
          <label>
            {copy.newPassword}
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={!ready}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            {copy.confirmPassword}
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={!ready}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          <p className="account-form-hint">{copy.passwordRequirements}</p>
          {error ? <p className="account-error" role="alert">{error}</p> : null}
          <button className="btn-primary" type="submit" disabled={busy || !ready}>
            {busy ? copy.wait : copy.resetButton}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
