import type { Metadata } from "next";
import { BrandsPageClient } from "@/components/pages/BrandsPageClient";
import { getBrandsDirectory } from "@/lib/products";
import "@/styles/brands.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Browse authentic streetwear and sneaker brands at SOLOVYEV STORE Israel — Gucci, Nike, Supreme, and more.",
  alternates: { canonical: `${siteUrl}/brands` },
  openGraph: {
    title: "Brands | SOLOVYEV STORE",
    description: `${getBrandsDirectory().length} brands available.`,
    url: `${siteUrl}/brands`,
  },
};

export default function BrandsPage() {
  return <BrandsPageClient />;
}
