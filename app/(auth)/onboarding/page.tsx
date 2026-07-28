"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/account/AuthCard";
import { useI18n } from "@/components/providers/I18nProvider";
import { isCheckoutIntent, postAuthPath } from "@/lib/customer-auth";

function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { dict } = useI18n();
  const copy = dict.account;
  const checkout = isCheckoutIntent(params.get("checkout"));
  const next = params.get("next");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) return setError(copy.nameRequired);
    setBusy(true);
    setError("");
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: name }),
    });
    const body = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(body.error || copy.configError);
    router.replace(postAuthPath({ hasDisplayName: true, checkout, next }));
    router.refresh();
  };

  return (
    <AuthCard title={copy.onboardingTitle} description={copy.onboardingHelp}>
      <form onSubmit={saveName} className="account-form">
        <label>
          {copy.name}
          <input
            type="text"
            autoComplete="nickname"
            required
            maxLength={80}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={copy.namePlaceholder}
          />
        </label>
        {error ? <p className="account-error" role="alert">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? copy.wait : copy.continueButton}
        </button>
      </form>
    </AuthCard>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
