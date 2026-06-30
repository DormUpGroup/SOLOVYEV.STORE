import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  brandToSlug,
  filterProducts,
  getAvailableBrands,
  getBrandBySlug,
  products,
} from "@/lib/products";
import { BrandCatalogPage } from "@/components/catalog/BrandCatalogPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAvailableBrands(products).map((brand) => ({
    slug: brandToSlug(brand),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return {};

  const count = filterProducts(products, {
    category: "all",
    brand,
    search: "",
    size: "",
    sort: "",
  }).length;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

  return {
    title: brand,
    description: `Shop ${count} authentic ${brand} items at SOLOVYEV STORE Israel. Sneakers, streetwear and accessories.`,
    alternates: {
      canonical: `${siteUrl}/brand/${slug}`,
    },
    openGraph: {
      title: `${brand} | SOLOVYEV STORE`,
      description: `${count} ${brand} drops available.`,
      url: `${siteUrl}/brand/${slug}`,
    },
  };
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  return <BrandCatalogPage brandName={brand} />;
}
