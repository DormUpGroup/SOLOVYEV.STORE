import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandNewPageClient } from "@/components/pages/BrandNewPageClient";
import { getBrandNewProducts } from "@/lib/products-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Brand New",
  description:
    "Shop brand new and deadstock authentic streetwear and sneakers at SOLOVYEV STORE Israel — 10/10 condition, verified before listing.",
  alternates: { canonical: `${siteUrl}/brand-new` },
  openGraph: {
    title: "Brand New | SOLOVYEV STORE",
    description: "Browse deadstock and unworn authentic pieces.",
    url: `${siteUrl}/brand-new`,
  },
};

export default async function BrandNewPage() {
  const products = await getBrandNewProducts();

  return (
    <Suspense fallback={null}>
      <BrandNewPageClient products={products} />
    </Suspense>
  );
}
