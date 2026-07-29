import type { Metadata } from "next";
import { LegalDocPageClient } from "@/components/pages/LegalDocPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for SOLOVYEV STORE — orders via WhatsApp, authenticity, shipping, returns, and Sell / Trade.",
  alternates: { canonical: `${siteUrl}/terms` },
};

export default function TermsPage() {
  return <LegalDocPageClient doc="terms" />;
}
