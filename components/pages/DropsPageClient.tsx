"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
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
import type { ProductCategory } from "@/lib/types";

function parseCategory(param: string | null): "all" | ProductCategory {
  if (param === "sneakers" || param === "clothing" || param === "accessories") {
    return param;
  }
  return "all";
}

export function DropsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = useMemo(
    () => parseCategory(searchParams.get("category")),
    [searchParams],
  );

  const onCategoryChange = useCallback(
    (category: "all" | ProductCategory) => {
      const url = category === "all" ? "/drops" : `/drops?category=${category}`;
      router.replace(url, { scroll: false });
    },
    [router],
  );

  return (
    <>
      <Header />
      <main>
        <div className="drops-page-intro">
          <Link href="/" className="back-link">
            ← BACK TO HOME
          </Link>
        </div>
        <CatalogSection
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
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
