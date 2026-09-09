import type { Metadata } from "next";
import { MysteryBoxDetailPageClient } from "@/components/pages/MysteryBoxDetailPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Large Mystery Box",
  description:
    "SOLOVYEV.STORE Large Mystery Box — curated authentic streetwear and sneakers. Authenticity guaranteed.",
  alternates: { canonical: `${siteUrl}/mystery-box/large` },
  openGraph: {
    title: "Large Mystery Box | SOLOVYEV STORE",
    description:
      "2 pairs of shoes, 1 outerwear, 3 T-shirts, 1 pair of jeans, 2 accessories.",
    url: `${siteUrl}/mystery-box/large`,
  },
};

export default function MysteryBoxLargePage() {
  return <MysteryBoxDetailPageClient variant="large" />;
}
