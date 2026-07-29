"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { dict } = useI18n();

  return (
    <main className="account-auth-shell">
      <section className="account-auth-card">
        <Link href="/" className="account-auth-logo">
          SOLOVYEV<span>.STORE</span>
        </Link>
        <p className="account-eyebrow">{dict.common.personalAccount}</p>
        <h1>{title}</h1>
        <p className="account-muted">{description}</p>
        {children}
      </section>
    </main>
  );
}
