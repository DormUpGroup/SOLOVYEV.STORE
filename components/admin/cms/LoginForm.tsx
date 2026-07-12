import { getAdminPath } from "@/lib/auth";

export function LoginForm({ showError }: { showError?: boolean }) {
  const adminPath = getAdminPath();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        action="/api/auth/login"
        method="POST"
        className="w-full max-w-sm border border-admin-border bg-admin-panel p-8"
      >
        <h1 className="mb-1 text-lg font-bold tracking-wider">SOLOVYEV.ADMIN</h1>
        <p className="mb-6 text-admin-muted">Store management panel</p>
        {showError ? (
          <p className="mb-4 text-admin-danger">Invalid credentials</p>
        ) : null}
        <label className="mb-1 block text-xs text-admin-muted">Login</label>
        <input
          name="login"
          type="text"
          autoComplete="username"
          required
          className="mb-4 w-full border border-admin-border bg-admin-bg px-3 py-2 outline-none focus:border-admin-accent"
        />
        <label className="mb-1 block text-xs text-admin-muted">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mb-6 w-full border border-admin-border bg-admin-bg px-3 py-2 outline-none focus:border-admin-accent"
        />
        <button
          type="submit"
          className="w-full bg-admin-accent py-2 font-bold text-black hover:opacity-90"
        >
          Unlock
        </button>
        <input type="hidden" name="redirect" value={`/${adminPath}`} />
      </form>
    </div>
  );
}
