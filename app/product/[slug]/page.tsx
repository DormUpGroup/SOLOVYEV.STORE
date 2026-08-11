import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  formatPriceOrDm,
  getProductBySlug,
  isProductUnavailable,
} from "@/lib/products";
import { absoluteProductImageUrl } from "@/lib/product-image";
import { getConfig, getProductBySlugFromStore, getProducts } from "@/lib/data/store";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { ProductPageDetails } from "@/components/product/ProductPageDetails";
import { safeJsonLd } from "@/lib/safe-json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = getProductBySlug(products, slug);
  if (!product) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";
  const ogImage = absoluteProductImageUrl(siteUrl, product.img);

  return {
    title: product.title,
    description: product.description
      ? product.description.slice(0, 160)
      : `${product.brand} — ${product.condition}. ${formatPriceOrDm(product.price)}. Authentic streetwear at SOLOVYEV STORE.`,
    openGraph: {
      title: product.title,
      description: product.description
        ? product.description.slice(0, 160)
        : `${product.brand} — ${formatPriceOrDm(product.price)}`,
      images: ogImage ? [{ url: ogImage, width: 800, height: 800 }] : [],
      url: `${siteUrl}/product/${product.slug}`,
    },
    alternates: {
      canonical: `${siteUrl}/product/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, config] = await Promise.all([
    getProductBySlugFromStore(slug),
    getConfig(),
  ]);
  if (!product) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";
  const unavailable = isProductUnavailable(product);
  const imageUrl = absoluteProductImageUrl(siteUrl, product.img);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(imageUrl ? { image: imageUrl } : {}),
    description: product.description || `${product.brand} — ${product.condition}`,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: config.currency.code,
      price: product.price,
      availability: unavailable
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${siteUrl}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <ProductPageClient product={product}>
        <ProductPageDetails
          product={product}
          currencySymbol={config.currency.symbol}
        />
      </ProductPageClient>
    </>
  );
}
