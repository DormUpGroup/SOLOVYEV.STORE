import type { Metadata } from "next";
import { AboutPageClient } from "@/components/pages/AboutPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SOLOVYEV STORE — premium streetwear and sneakers consignment. Authenticity guaranteed, fast shipping, buy, sell, and trade.",
  alternates: { canonical: `${siteUrl}/about` },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
