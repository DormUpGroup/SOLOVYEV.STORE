import type { Metadata } from "next";
import { MysteryBoxPageClient } from "@/components/pages/MysteryBoxPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Mystery Box",
  description:
    "SOLOVYEV.STORE Mystery Box — curated authentic streetwear and sneakers. Medium and Large boxes. Authenticity guaranteed.",
  alternates: { canonical: `${siteUrl}/mystery-box` },
  openGraph: {
    title: "Mystery Box | SOLOVYEV STORE",
    description:
      "Discover a curated selection of premium streetwear and sneakers with our Mystery Box.",
    url: `${siteUrl}/mystery-box`,
  },
};

export default function MysteryBoxPage() {
  return <MysteryBoxPageClient />;
}
