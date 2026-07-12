"use client";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { UIProvider } from "@/components/providers/UIProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import {
  StoreProvider,
  type StoreContextValue,
} from "@/components/providers/StoreProvider";

export function AppProviders({
  children,
  store,
}: {
  children: React.ReactNode;
  store: StoreContextValue;
}) {
  return (
    <StoreProvider value={store}>
      <I18nProvider>
        <ThemeProvider>
          <CartProvider>
            <UIProvider>{children}</UIProvider>
          </CartProvider>
        </ThemeProvider>
      </I18nProvider>
    </StoreProvider>
  );
}
