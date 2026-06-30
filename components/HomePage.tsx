"use client";

import { BrandMarquee } from "@/components/layout/Marquees";
import { Header } from "@/components/layout/Header";
import {
  HeroSection,
  InstagramStrip,
  TrustSection,
} from "@/components/layout/HeroSections";
import { NewestArrivals } from "@/components/catalog/CatalogSection";
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

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <BrandMarquee />
        <NewestArrivals />
        <TrustSection />
        <InstagramStrip />
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
