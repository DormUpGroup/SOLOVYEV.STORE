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
import { useI18n } from "@/components/providers/I18nProvider";
import type { Product, ProductCategory } from "@/lib/types";
import type { ClothingType } from "@/lib/clothing-types";
import {
  buildCatalogUrl,
  parseClothingType,
  parseProductCategory,
} from "@/lib/catalog-url";

interface BrandNewPageClientProps {
  products: Product[];
}

export function BrandNewPageClient({ products }: BrandNewPageClientProps) {
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
      router.replace(buildCatalogUrl("/brand-new", category), { scroll: false });
    },
    [router],
  );

  const onClothingTypeChange = useCallback(
    (type: "" | ClothingType) => {
      router.replace(buildCatalogUrl("/brand-new", "clothing", type), { scroll: false });
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
          <p className="made-to-order-intro">{dict.catalog.brandNewIntro}</p>
        </div>
        <CatalogSection
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          activeClothingType={activeClothingType}
          onClothingTypeChange={onClothingTypeChange}
          productsOverride={products}
          sectionTitle={dict.catalog.brandNewTitle}
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

