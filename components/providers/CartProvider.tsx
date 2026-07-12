"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getProductById } from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { trackAddToCart } from "@/lib/analytics";
import { useI18n } from "@/components/providers/I18nProvider";
import type { CartItem } from "@/lib/types";

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
  updateQuantity: (id: number, size: string, delta: number) => void;
  removeFromCart: (id: number, size: string) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function normalizeCart(raw: CartItem[]): CartItem[] {
  return raw.map((item) => {
    const q = item.quantity ?? item.qty ?? 1;
    return { ...item, quantity: q, qty: q };
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useStore();
  const { dict } = useI18n();
  const { cart: cartText } = dict;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [hydrated, setHydrated] = useState(false);

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

      setCart((prev) => {
        const existing = prev.find((i) => i.id === id && i.size === size);
        if (existing) {
          return prev.map((i) =>
            i.id === id && i.size === size
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  qty: i.quantity + 1,
                }
              : i,
          );
        }
        return [...prev, { id, size, quantity: 1, qty: 1 }];
      });

      trackAddToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        size: size || "One Size",
      });
      showToast(cartText.added);
      return true;
    },
    [showToast, cartText.added, cartText.selectSize, products],
  );

  const updateQuantity = useCallback((id: number, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id || item.size !== size) return item;
          const nextQty = item.quantity + delta;
          return { ...item, quantity: nextQty, qty: nextQty };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

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
        updateQuantity,
        removeFromCart,
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
