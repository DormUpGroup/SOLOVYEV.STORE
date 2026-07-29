"use client";

import Image from "next/image";
import Link from "next/link";
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

export function BrandsPageClient() {
  const { products } = useStore();
  const { dict } = useI18n();
  const brands = getBrandsDirectory(products);
  const { catalog, common } = dict;

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

          <ul className="brands-grid">
            {brands.map((brand) => {
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
                        <Image
                          src={brand.logo}
                          alt=""
                          width={200}
                          height={200}
                          className="brand-logo-img"
                        />
                      </span>
                      <span className="brand-card-overlay" aria-hidden="true">
                        <span className="brand-card-name">{brand.name}</span>
                      </span>
                    </span>
                    <span className="brand-card-count">{stockLabel}</span>
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
