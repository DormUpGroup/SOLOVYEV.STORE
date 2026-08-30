"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import {
  ConsentBanner,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import type { ClothingType } from "@/lib/clothing-types";
import type { ProductCategory } from "@/lib/types";
import {
  buildCatalogUrl,
  parseClothingType,
  parseProductCategory,
} from "@/lib/catalog-url";
import { useI18n } from "@/components/providers/I18nProvider";

export function DropsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useI18n();
  const activeCategory = useMemo(
    () => parseProductCategory(searchParams.get("category")),
    [searchParams],
  );
  const activeClothingType = useMemo(
    () =>
      activeCategory === "clothing" ? parseClothingType(searchParams.get("type")) : "",
    [activeCategory, searchParams],
  );

  const onCategoryChange = useCallback(
    (category: "all" | ProductCategory) => {
      router.replace(buildCatalogUrl("/drops", category), { scroll: false });
    },
    [router],
  );

  const onClothingTypeChange = useCallback(
    (type: "" | ClothingType) => {
      router.replace(buildCatalogUrl("/drops", "clothing", type), { scroll: false });
    },
    [router],
  );

  return (
    <>
      <Header />
      <main>
        <div className="drops-page-intro">
          <Link href="/" className="back-link">
            {dict.common.backToHome}
          </Link>
        </div>
        <CatalogSection
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          activeClothingType={activeClothingType}
          onClothingTypeChange={onClothingTypeChange}
        />
      </main>
      <MinimalFooter />
      <ConsentBanner />
      <ToastNotification />
      <QuickViewModal />
      <SellTradeModal />
      <FaqModal />
      <CartDrawer />
    </>
  );
}
