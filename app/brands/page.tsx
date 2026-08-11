import type { Metadata } from "next";
import { BrandsPageClient } from "@/components/pages/BrandsPageClient";
import { getBrandsDirectory } from "@/lib/products";
import { getProducts } from "@/lib/data/store";
import "@/styles/brands.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProducts();
  const brands = getBrandsDirectory(products);

  return {
    title: "Brands",
    description:
      "Browse authentic streetwear and sneaker brands at SOLOVYEV STORE — Gucci, Nike, Supreme, and more.",
    alternates: { canonical: `${siteUrl}/brands` },
    openGraph: {
      title: "Brands | SOLOVYEV STORE",
      description: `${brands.length} brands available.`,
      url: `${siteUrl}/brands`,
    },
  };
}

export default function BrandsPage() {
  return <BrandsPageClient />;
}
