"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function MarketplaceToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    window.setTimeout(() => setMessage(null), 2200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? <div className="mp-toast">{message}</div> : null}
    </ToastContext.Provider>
  );
}

export function useMarketplaceToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { showToast: (_: string) => undefined };
  }
  return ctx;
}
