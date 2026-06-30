import type { Metadata } from "next";
import { Suspense } from "react";
import { DropsPageClient } from "@/components/pages/DropsPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "All Drops",
  description:
    "Shop all authentic streetwear and sneakers at SOLOVYEV STORE Israel — Jordan, Yeezy, Supreme, vintage luxury, and more.",
  alternates: { canonical: `${siteUrl}/drops` },
  openGraph: {
    title: "All Drops | SOLOVYEV STORE",
    description: "Browse the full catalog of authentic drops.",
    url: `${siteUrl}/drops`,
  },
};

export default function DropsPage() {
  return (
    <Suspense fallback={null}>
      <DropsPageClient />
    </Suspense>
  );
}
