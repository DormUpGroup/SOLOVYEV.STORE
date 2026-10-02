"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MarketplaceLoginForm() {
  const searchParams = useSearchParams();
  const showError = searchParams.get("error") === "1";
  const next = searchParams.get("next") || "/marketplace";
  const safeNext =
    next.startsWith("/marketplace") && !next.startsWith("//")
      ? next
      : "/marketplace";

  return (
    <div className="mp-login-page">
      <div className="mp-login-card">
        <Link href="/" className="mp-logo" style={{ marginBottom: "1.5rem" }}>
          <span className="mp-logo-mark">SOLOVYEV</span>
          <span className="mp-logo-sub">RESALE</span>
        </Link>
        <h1>Demo access</h1>
        <p>
          Marketplace demo is private. Sign in with admin credentials to
          continue.
        </p>
        {showError ? (
          <p className="mp-login-error">Invalid credentials</p>
        ) : null}
        <form action="/api/auth/login" method="POST" className="mp-login-form">
          <label className="mp-field">
            <span>Login</span>
            <input
              className="mp-input"
              name="login"
              type="text"
              autoComplete="username"
              required
            />
          </label>
          <label className="mp-field">
            <span>Password</span>
            <input
              className="mp-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <input type="hidden" name="redirect" value={safeNext} />
          <button type="submit" className="mp-btn mp-btn-primary mp-btn-block">
            Enter demo
          </button>
        </form>
        <Link href="/" className="mp-back-store" style={{ marginTop: "1.25rem" }}>
          ← Back to store
        </Link>
      </div>
    </div>
  );
}

export default function MarketplaceLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mp-login-page">
          <div className="mp-login-card">…</div>
        </div>
      }
    >
      <MarketplaceLoginForm />
    </Suspense>
  );
}
