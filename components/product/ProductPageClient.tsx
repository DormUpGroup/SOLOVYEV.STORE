"use client";

import { Header } from "@/components/layout/Header";
import {
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { trackViewItem } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { useEffect } from "react";

interface ProductPageClientProps {
  product: Product;
  children: React.ReactNode;
}

export function ProductPageClient({ product, children }: ProductPageClientProps) {
  useEffect(() => {
    trackViewItem(product);
  }, [product]);

  return (
    <>
      <Header />
      <main>{children}</main>
      <MinimalFooter />
      <ToastNotification />
      <QuickViewModal />
      <SellTradeModal />
      <FaqModal />
      <CartDrawer />
    </>
  );
}
