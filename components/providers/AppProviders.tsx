"use client";

import { CartProvider } from "@/components/providers/CartProvider";
import { UIProvider } from "@/components/providers/UIProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
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
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <UIProvider>{children}</UIProvider>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </I18nProvider>
    </StoreProvider>
  );
}
