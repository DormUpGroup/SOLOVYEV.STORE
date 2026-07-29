"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductCategory } from "@/lib/types";
import { Header } from "@/components/layout/Header";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import {
  ConsentBanner,
  FixedBottomBar,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useI18n } from "@/components/providers/I18nProvider";

interface BrandCatalogPageProps {
  brandName: string;
}

export function BrandCatalogPage({ brandName }: BrandCatalogPageProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | ProductCategory>("all");
  const { dict } = useI18n();
  const { catalog } = dict;

  return (
    <>
      <Header />
      <main>
        <section className="brand-page-intro">
          <div className="brand-page-intro-inner">
            <p className="brand-page-eyebrow">{catalog.shopByBrandEyebrow}</p>
            <h1>{brandName}</h1>
            <p className="brand-page-desc">
              {catalog.brandPageDesc.replace("{brand}", brandName)}{" "}
              <Link href="/brands" className="inline-link">
                {catalog.viewAllBrands}
              </Link>
            </p>
          </div>
        </section>
        <CatalogSection
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          initialBrand={brandName}
          brandPageTitle={brandName}
        />
      </main>
      <MinimalFooter />
      <FixedBottomBar />
      <ConsentBanner />
      <ToastNotification />
      <QuickViewModal />
      <SellTradeModal />
      <FaqModal />
      <CartDrawer />
    </>
  );
}
