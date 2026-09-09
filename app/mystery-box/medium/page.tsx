import type { Metadata } from "next";
import { MysteryBoxDetailPageClient } from "@/components/pages/MysteryBoxDetailPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Medium Mystery Box",
  description:
    "SOLOVYEV.STORE Medium Mystery Box — curated authentic streetwear and sneakers. Authenticity guaranteed.",
  alternates: { canonical: `${siteUrl}/mystery-box/medium` },
  openGraph: {
    title: "Medium Mystery Box | SOLOVYEV STORE",
    description:
      "1 pair of shoes, 1 outerwear, 2 T-shirts, 1 pair of jeans, 1 accessory.",
    url: `${siteUrl}/mystery-box/medium`,
  },
};

export default function MysteryBoxMediumPage() {
  return <MysteryBoxDetailPageClient variant="medium" />;
}
