import Link from "next/link";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="account-auth-shell">
      <section className="account-auth-card">
        <Link href="/" className="account-auth-logo">
          SOLOVYEV<span>.STORE</span>
        </Link>
        <p className="account-eyebrow">PERSONAL ACCOUNT</p>
        <h1>{title}</h1>
        <p className="account-muted">{description}</p>
        {children}
      </section>
    </main>
  );
}
