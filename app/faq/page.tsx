import type { Metadata } from "next";
import { getFaqItems } from "@/lib/data/store";
import { FaqPageClient } from "@/components/pages/FaqPageClient";
import { safeJsonLd } from "@/lib/safe-json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "F.A.Q.",
  description:
    "Frequently asked questions about authenticity, shipping, returns, and Sell/Trade at SOLOVYEV STORE Israel.",
  alternates: { canonical: `${siteUrl}/faq` },
};

export default async function FaqPage() {
  const faqItems = await getFaqItems();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <FaqPageClient />
    </>
  );
}
