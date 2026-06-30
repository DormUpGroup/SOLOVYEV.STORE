"use client";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { UIProvider } from "@/components/providers/UIProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <CartProvider>
          <UIProvider>{children}</UIProvider>
        </CartProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
