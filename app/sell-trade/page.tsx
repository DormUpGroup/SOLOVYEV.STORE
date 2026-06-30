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

export default function SellTradePage() {
  const { openSellTrade } = useUI();

  useEffect(() => {
    openSellTrade();
  }, [openSellTrade]);

  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container">
          <Link href="/" className="back-link">
            ← BACK TO STORE
          </Link>
          <h1>SELL OR TRADE YOUR HEAT</h1>
          <p>
            Use the valuation portal to submit your item. We reply on WhatsApp
            within 2 hours.
          </p>
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
