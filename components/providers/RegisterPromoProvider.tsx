"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const HIDDEN_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/welcome",
  "/account",
  "/auth/callback",
]);

export function isRegisterPromoHiddenPath(pathname: string): boolean {
  if (HIDDEN_PATHS.has(pathname) || pathname.startsWith("/account/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/admin-internal")) {
    return true;
  }
  return false;
}

interface RegisterPromoContextValue {
  dismissed: boolean;
  isGuest: boolean;
  showFab: boolean;
  showPriceOffer: boolean;
  dismiss: () => void;
}

const RegisterPromoContext = createContext<RegisterPromoContextValue | null>(null);

export function RegisterPromoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => setDismissed(true), []);

  const value = useMemo<RegisterPromoContextValue>(() => {
    const onAdminPage =
      typeof document !== "undefined" && Boolean(document.querySelector(".admin-cms"));
    const isGuest = !loading && !user;
    const hidden = isRegisterPromoHiddenPath(pathname) || onAdminPage;
    return {
      dismissed,
      isGuest,
      showFab: isGuest && dismissed && !hidden,
      showPriceOffer: isGuest && dismissed && !hidden,
      dismiss,
    };
  }, [dismiss, dismissed, loading, pathname, user]);

  return (
    <RegisterPromoContext.Provider value={value}>
      {children}
    </RegisterPromoContext.Provider>
  );
}

export function useRegisterPromo() {
  const value = useContext(RegisterPromoContext);
  if (!value) throw new Error("useRegisterPromo must be used within RegisterPromoProvider");
  return value;
}
