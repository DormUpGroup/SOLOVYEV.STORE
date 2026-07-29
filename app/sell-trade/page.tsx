"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import {
  FixedBottomBar,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";

export default function SellTradePage() {
  const { openSellTrade } = useUI();
  const { dict } = useI18n();

  useEffect(() => {
    openSellTrade();
  }, [openSellTrade]);

  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container">
          <Link href="/" className="back-link">
            {dict.common.backToStore}
          </Link>
          <h1>{dict.sellTrade.title}</h1>
          <p>{dict.sellTrade.pageIntro}</p>
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
