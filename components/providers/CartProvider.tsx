"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getProductById } from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { trackAddToCart } from "@/lib/analytics";
import { useI18n } from "@/components/providers/I18nProvider";
import type { CartItem } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

interface ToastState {
  message: string;
  type: "success" | "error";
}

interface CartContextValue {
  cart: CartItem[];
  cartCount: number;
  isHydrated: boolean;
  isOpen: boolean;
  toast: ToastState | null;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (id: number, size: string) => boolean;
  removeFromCart: (id: number, size: string) => void;
  clearCart: () => void;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function normalizeCart(raw: CartItem[]): CartItem[] {
  return raw.map((item) => ({ ...item, quantity: 1, qty: 1 }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useStore();
  const { dict } = useI18n();
  const { cart: cartText } = dict;
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const syncedUserRef = useRef<string | null>(null);
  const previousUserRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("solovyev_cart");
      if (saved) setCart(normalizeCart(JSON.parse(saved)));
    } catch {
      setCart([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("solovyev_cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      if (previousUserRef.current) setCart([]);
      previousUserRef.current = null;
      syncedUserRef.current = null;
      return;
    }
    previousUserRef.current = user.id;
    if (syncedUserRef.current === user.id) return;

    let cancelled = false;
    fetch("/api/account/cart")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(async (data: { items?: Array<{ product_id: number; size: string; quantity: number }> }) => {
        if (cancelled) return;
        const merged = new Map<string, CartItem>();
        for (const item of cart) merged.set(`${item.id}:${item.size}`, { ...item, quantity: 1, qty: 1 });
        for (const item of data.items ?? []) {
          const key = `${item.product_id}:${item.size}`;
          merged.set(key, { id: item.product_id, size: item.size, quantity: 1, qty: 1 });
        }
        const next = [...merged.values()];
        setCart(next);
        syncedUserRef.current = user.id;
        await fetch("/api/account/cart", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: next }),
        });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [cart, hydrated, user]);

  useEffect(() => {
    if (!hydrated || !user || syncedUserRef.current !== user.id) return;
    const timer = window.setTimeout(() => {
      fetch("/api/account/cart", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cart }),
      }).catch(() => undefined);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cart, hydrated, user]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), 3200);
    },
    [],
  );

  const addToCart = useCallback(
    (id: number, size: string): boolean => {
      const product = getProductById(products, id);
      if (!product) return false;

      if (product.sizes.length > 0 && !size) {
        showToast(cartText.selectSize, "error");
        return false;
      }

      let alreadyInCart = false;
      setCart((prev) => {
        if (prev.some((i) => i.id === id && i.size === size)) {
          alreadyInCart = true;
          return prev;
        }
        return [...prev, { id, size, quantity: 1, qty: 1 }];
      });

      if (!alreadyInCart) {
        trackAddToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          size: size || "One Size",
        });
      }
      showToast(alreadyInCart ? cartText.alreadyInCart : cartText.added);
      return true;
    },
    [showToast, cartText.added, cartText.alreadyInCart, cartText.selectSize, products],
  );

  const removeFromCart = useCallback((id: number, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isHydrated: hydrated,
        isOpen,
        toast,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        clearCart: () => setCart([]),
        showToast,
        clearToast: () => setToast(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
