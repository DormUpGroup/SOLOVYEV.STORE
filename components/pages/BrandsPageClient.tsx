"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  FixedBottomBar,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getBrandsDirectory } from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { useI18n } from "@/components/providers/I18nProvider";

function BrandMiniLogo({ name, logo }: { name: string; logo: string }) {
  const [failed, setFailed] = useState(false);
  const fallbackLabel = name.toUpperCase();

  if (failed) {
    return (
      <span className="brand-mini-logo-fallback" aria-hidden="true">
        {fallbackLabel || "BRAND"}
      </span>
    );
  }

  const isLocalLogo = logo.startsWith("/assets/brands/");

  return (
    <Image
      src={logo}
      alt=""
      width={137}
      height={40}
      className="brand-mini-logo-img"
      unoptimized={isLocalLogo}
      onError={() => setFailed(true)}
    />
  );
}

export function BrandsPageClient() {
  const { products } = useStore();
  const { dict } = useI18n();
  const brands = getBrandsDirectory(products);
  const [query, setQuery] = useState("");
  const { catalog, common } = dict;
  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(q));
  }, [brands, query]);

  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container brands-page">
          <Link href="/drops" className="back-link">
            {common.backToDrops}
          </Link>
          <header className="brands-page-header">
            <p className="brand-page-eyebrow">{catalog.shopByBrandEyebrow}</p>
            <h1>{catalog.brandsTitle}</h1>
            <p className="brands-page-desc">{catalog.brandsDesc}</p>
          </header>

          <div className="brands-search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={catalog.searchPlaceholder}
              className="brands-search-input"
              aria-label={catalog.searchPlaceholder}
            />
          </div>

          <ul className="brands-grid">
            {filteredBrands.map((brand) => {
              const stockLabel = catalog.stockCount.replace(
                "{count}",
                String(brand.count),
              );
              return (
                <li key={brand.slug}>
                  <Link
                    href={`/brand/${brand.slug}`}
                    className="brand-card"
                    aria-label={`${brand.name}, ${stockLabel}`}
                  >
                    <span className="brand-card-visual">
                      <span className="brand-card-logo">
                        <span className="brand-mini-logo" aria-hidden="true">
                          <BrandMiniLogo name={brand.name} logo={brand.logo} />
                        </span>
                        <span className="brand-card-text">
                          <span className="brand-card-name">{brand.name}</span>
                          <span className="brand-card-count">{stockLabel}</span>
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <MinimalFooter />
      <FixedBottomBar />
      <ToastNotification />
      <QuickViewModal />
      <SellTradeModal />
      <FaqModal />
      <CartDrawer />
    </>
  );
}
