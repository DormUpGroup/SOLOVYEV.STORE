import type { Metadata } from "next";
import { Suspense } from "react";
import { MadeToOrderPageClient } from "@/components/pages/MadeToOrderPageClient";
import { getMadeToOrderProducts } from "@/lib/products-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Made to Order",
  description:
    "Order authentic streetwear and sneakers on request at SOLOVYEV STORE — curated pieces sourced for you.",
  alternates: { canonical: `${siteUrl}/made-to-order` },
  openGraph: {
    title: "Made to Order | SOLOVYEV STORE",
    description: "Browse items available to order on request.",
    url: `${siteUrl}/made-to-order`,
  },
};

export default async function MadeToOrderPage() {
  const products = await getMadeToOrderProducts();

  return (
    <Suspense fallback={null}>
      <MadeToOrderPageClient products={products} />
    </Suspense>
  );
}
