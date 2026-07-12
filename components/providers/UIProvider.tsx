"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/types";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";

type ModalType = "quickView" | "sellTrade" | "faq" | null;

interface UIContextValue {
  activeModal: ModalType;
  selectedProduct: Product | null;
  openQuickView: (product: Product) => void;
  openSellTrade: () => void;
  openFaq: () => void;
  closeAll: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const closeAll = useCallback(() => {
    setActiveModal(null);
    setSelectedProduct(null);
    unlockBodyScroll();
  }, []);

  const openQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setActiveModal("quickView");
    lockBodyScroll();
  }, []);

  const openSellTrade = useCallback(() => {
    setActiveModal("sellTrade");
    lockBodyScroll();
  }, []);

  const openFaq = useCallback(() => {
    setActiveModal("faq");
    lockBodyScroll();
  }, []);

  return (
    <UIContext.Provider
      value={{
        activeModal,
        selectedProduct,
        openQuickView,
        openSellTrade,
        openFaq,
        closeAll,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
