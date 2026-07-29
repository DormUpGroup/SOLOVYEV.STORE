"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import {
  FixedBottomBar,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { FaqAccordion } from "@/components/modals/FaqModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { useI18n } from "@/components/providers/I18nProvider";

export function FaqPageClient() {
  const { dict } = useI18n();

  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container">
          <Link href="/" className="back-link">
            {dict.common.backToStore}
          </Link>
          <h1>{dict.faq.title}</h1>
          <FaqAccordion />
        </div>
      </main>
      <MinimalFooter />
      <FixedBottomBar />
      <ToastNotification />
      <SellTradeModal />
      <FaqModal />
      <QuickViewModal />
      <CartDrawer />
    </>
  );
}
