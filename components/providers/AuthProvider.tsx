"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, hasSupabaseBrowserConfig } from "@/utils/supabase/client";

interface AuthContextValue {
  user: User | null;
  displayName: string | null;
  loading: boolean;
  configured: boolean;
  firstOrderDiscountEligible: boolean;
  consumeFirstOrderDiscount: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseBrowserConfig();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(configured);
  const [firstOrderDiscountEligible, setFirstOrderDiscountEligible] = useState(false);

  const loadProfile = useCallback(
    async (userId: string | undefined) => {
      if (!supabase || !userId) {
        setDisplayName(null);
        setFirstOrderDiscountEligible(false);
        return;
      }
      const [{ data }, orders] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .neq("status", "cancelled"),
      ]);
      const name = data?.display_name?.trim() || null;
      setDisplayName(name);
      setFirstOrderDiscountEligible(!orders.error && (orders.count ?? 0) === 0);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      await loadProfile(data.user?.id);
      if (active) setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void loadProfile(session?.user?.id);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user?.id);
  }, [loadProfile, user?.id]);

  const consumeFirstOrderDiscount = useCallback(() => {
    setFirstOrderDiscountEligible(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      displayName,
      loading,
      configured,
      firstOrderDiscountEligible,
      consumeFirstOrderDiscount,
      refreshProfile,
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setDisplayName(null);
        setFirstOrderDiscountEligible(false);
      },
    }),
    [
      configured,
      consumeFirstOrderDiscount,
      displayName,
      firstOrderDiscountEligible,
      loading,
      refreshProfile,
      supabase,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
