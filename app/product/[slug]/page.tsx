import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatPrice,
  formatPriceOrDm,
  getProductBySlug,
  getStatusLabel,
  isProductUnavailable,
} from "@/lib/products";
import { getConfig, getProductBySlugFromStore, getProducts } from "@/lib/data/store";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";

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

  return {
    title: product.title,
    description: product.description
      ? product.description.slice(0, 160)
      : `${product.brand} — ${product.condition}. ${formatPriceOrDm(product.price)}. Authentic streetwear at SOLOVYEV STORE Israel.`,
    openGraph: {
      title: product.title,
      description: product.description
        ? product.description.slice(0, 160)
        : `${product.brand} — ${formatPriceOrDm(product.price)}`,
      images: [{ url: product.img, width: 800, height: 800 }],
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

  const sym = config.currency.symbol;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";
  const unavailable = isProductUnavailable(product);
  const statusLabel = getStatusLabel(product.status);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: `${siteUrl}${product.img}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient product={product}>
        <article className="product-page">
          <Link href="/drops" className="back-link">
            ← BACK TO DROPS
          </Link>
          <div className="product-page-grid">
            <div className="product-page-image">
              <Image
                src={product.img}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {statusLabel ? (
                <span className={`product-status-badge status-${product.status}`}>
                  {statusLabel}
                </span>
              ) : null}
            </div>
            <div className="product-page-details">
              <p className="product-page-brand">{product.brand}</p>
              <h1>{product.title}</h1>
              <p className="modal-price">{formatPriceOrDm(product.price, sym)}</p>
              {product.description ? (
                <p className="product-description">{product.description}</p>
              ) : null}
              {product.originalPrice ? (
                <p className="original-price-inline">
                  Was {formatPrice(product.originalPrice, sym)}
                </p>
              ) : null}
              <p>
                <strong>Condition:</strong> {product.condition}
              </p>
              <p>
                <strong>Category:</strong> {product.category}
              </p>
              <p>
                <strong>Sizes:</strong>{" "}
                {product.sizes.length ? product.sizes.join(", ") : "N/A"}
              </p>
              <ProductPurchasePanel product={product} showQuickView={false} />
            </div>
          </div>
        </article>
      </ProductPageClient>
    </>
  );
}
