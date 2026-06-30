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

interface BrandCatalogPageProps {
  brandName: string;
}

export function BrandCatalogPage({ brandName }: BrandCatalogPageProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | ProductCategory>("all");

  return (
    <>
      <Header />
      <main>
        <section className="brand-page-intro">
          <div className="brand-page-intro-inner">
            <p className="brand-page-eyebrow">SHOP BY BRAND</p>
            <h1>{brandName}</h1>
            <p className="brand-page-desc">
              Authentic {brandName} drops from SOLOVYEV STORE Israel.{" "}
              <Link href="/brands" className="inline-link">
                View all brands
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
