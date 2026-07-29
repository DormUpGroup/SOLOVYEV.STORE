import type { Metadata } from "next";
import { LegalDocPageClient } from "@/components/pages/LegalDocPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for SOLOVYEV STORE — how we handle account data, analytics, WhatsApp checkout, and cookies on solovyev.store.",
  alternates: { canonical: `${siteUrl}/privacy` },
};

export default function PrivacyPage() {
  return <LegalDocPageClient doc="privacy" />;
}
