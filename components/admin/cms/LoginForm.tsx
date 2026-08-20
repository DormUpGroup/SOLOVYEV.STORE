import { Lock } from "lucide-react";
import { getAdminPath } from "@/lib/auth";

export function LoginForm({ showError }: { showError?: boolean }) {
  const adminPath = getAdminPath();

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg p-6">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(10,132,255,0.12), transparent)",
        }}
      />
      <form
        action="/api/auth/login"
        method="POST"
        className="admin-card relative w-full max-w-[400px] p-9 shadow-admin"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-admin-accent/15 text-admin-accent">
          <Lock size={22} strokeWidth={1.75} />
        </div>
        <h1 className="mb-1 text-[22px] font-semibold tracking-tight text-admin-text">
          Solovyev Store
        </h1>
        <p className="mb-7 text-sm text-admin-muted">Sign in to manage your store</p>
        {showError ? (
          <p className="mb-4 rounded-lg bg-admin-danger/15 px-3 py-2 text-sm text-admin-danger">
            Invalid credentials
          </p>
        ) : null}
        <label className="mb-1 block text-sm font-medium text-admin-muted">Login</label>
        <input
          name="login"
          type="text"
          autoComplete="username"
          required
          className="admin-input mb-4"
        />
        <label className="mb-1 block text-sm font-medium text-admin-muted">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="admin-input mb-7"
        />
        <button type="submit" className="admin-btn admin-btn-primary w-full py-2.5">
          Sign in
        </button>
        <input type="hidden" name="redirect" value={`/${adminPath}`} />
      </form>
    </div>
  );
}
