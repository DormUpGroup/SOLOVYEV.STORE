"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

interface FavoritesContextValue {
  favoriteIds: Set<number>;
  loading: boolean;
  toggleFavorite: (productId: number) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [ids, setIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds([]);
      return;
    }
    setLoading(true);
    fetch("/api/account/favorites")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { favoriteIds?: number[] }) => setIds(data.favoriteIds ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleFavorite = useCallback(async (productId: number) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const removing = ids.includes(productId);
    setIds((current) => removing ? current.filter((id) => id !== productId) : [...current, productId]);
    const response = await fetch("/api/account/favorites", {
      method: removing ? "DELETE" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) {
      setIds((current) => removing ? [...current, productId] : current.filter((id) => id !== productId));
    }
  }, [ids, router, user]);

  const value = useMemo(() => ({ favoriteIds: new Set(ids), loading, toggleFavorite }), [ids, loading, toggleFavorite]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used within FavoritesProvider");
  return value;
}
