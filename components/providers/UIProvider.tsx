"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/types";

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
    document.body.classList.remove("no-scroll");
  }, []);

  const openQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setActiveModal("quickView");
    document.body.classList.add("no-scroll");
  }, []);

  const openSellTrade = useCallback(() => {
    setActiveModal("sellTrade");
    document.body.classList.add("no-scroll");
  }, []);

  const openFaq = useCallback(() => {
    setActiveModal("faq");
    document.body.classList.add("no-scroll");
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
