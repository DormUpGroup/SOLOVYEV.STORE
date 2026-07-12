"use client";

import { createContext, useContext } from "react";
import type { FaqItem, Product, StoreConfig } from "@/lib/types";

export interface StoreContextValue {
  products: Product[];
  config: StoreConfig;
  faqItems: FaqItem[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  value,
  children,
}: {
  value: StoreContextValue;
  children: React.ReactNode;
}) {
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}
