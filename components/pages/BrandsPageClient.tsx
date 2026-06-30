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

export function BrandsPageClient() {
  const brands = getBrandsDirectory();

  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container brands-page">
          <Link href="/drops" className="back-link">
            ← BACK TO DROPS
          </Link>
          <header className="brands-page-header">
            <p className="brand-page-eyebrow">SHOP BY BRAND</p>
            <h1>BRANDS</h1>
            <p className="brands-page-desc">
              Authentic streetwear and sneakers — browse by label.
            </p>
          </header>

          <ul className="brands-grid">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/brand/${brand.slug}`}
                  className="brand-card"
                  aria-label={`${brand.name}, ${brand.count} ${brand.count === 1 ? "item" : "items"} in stock`}
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
                  <span className="brand-card-count">
                    {brand.count} {brand.count === 1 ? "item" : "items"} in
                    stock
                  </span>
                </Link>
              </li>
            ))}
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
