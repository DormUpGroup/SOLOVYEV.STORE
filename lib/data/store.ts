import { unstable_cache } from "next/cache";
import type { FaqItem, StoreConfig } from "@/lib/types";
import configData from "@/data/config.json";
import faqData from "@/data/faq.json";
import { createServiceClient } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase";
import { normalizeStoreConfig } from "@/lib/store-config";
import { getProducts, getProductBySlugFromStore, STORE_TAG } from "@/lib/products-server";

export { STORE_TAG, getProducts, getProductBySlugFromStore };
export { productToDbRow } from "@/lib/supabase-products";
export { isSupabaseConfigured };

type DbFaq = {
  id: number;
  sort_order: number;
  question: string;
  answer: string;
};

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function jsonFallbackConfig(): StoreConfig {
  return normalizeStoreConfig(configData as StoreConfig);
}

function jsonFallbackFaq(): FaqItem[] {
  return faqData as FaqItem[];
}

async function fetchConfigFromDb(): Promise<StoreConfig> {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    console.warn("[store] SUPABASE_SERVICE_ROLE_KEY missing — serving JSON fallback for config");
    return jsonFallbackConfig();
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("store_config")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.data) return jsonFallbackConfig();
  return normalizeStoreConfig(data.data as StoreConfig);
}

export const getConfig = unstable_cache(fetchConfigFromDb, ["store-config"], {
  tags: [STORE_TAG],
  revalidate: 60,
});

async function fetchFaqFromDb(): Promise<FaqItem[]> {
  if (!isSupabaseConfigured() || !hasServiceRole()) return jsonFallbackFaq();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("faq_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return jsonFallbackFaq();
  return (data as DbFaq[]).map((row) => ({
    question: row.question,
    answer: row.answer,
  }));
}

export const getFaqItems = unstable_cache(fetchFaqFromDb, ["store-faq"], {
  tags: [STORE_TAG],
  revalidate: 60,
});

export type AnalyticsSummary = {
  views: number;
  cart: number;
  wa: number;
  sell: number;
  byProduct: Record<number, { views: number; cart: number; wa: number }>;
  recent: Array<{
    event_type: string;
    product_id: number | null;
    created_at: string;
  }>;
};

export async function getAnalyticsSummary(days = 7): Promise<AnalyticsSummary> {
  const empty: AnalyticsSummary = {
    views: 0,
    cart: 0,
    wa: 0,
    sell: 0,
    byProduct: {},
    recent: [],
  };

  if (!isSupabaseConfigured()) return empty;

  const since = new Date(Date.now() - days * 86400000).toISOString();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, product_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return empty;

  const summary = { ...empty, byProduct: {} as AnalyticsSummary["byProduct"] };

  for (const row of data) {
    const pid = row.product_id ?? 0;
    if (!summary.byProduct[pid]) {
      summary.byProduct[pid] = { views: 0, cart: 0, wa: 0 };
    }
    if (row.event_type === "view_item") {
      summary.views++;
      if (pid) summary.byProduct[pid].views++;
    } else if (row.event_type === "add_to_cart") {
      summary.cart++;
      if (pid) summary.byProduct[pid].cart++;
    } else if (row.event_type === "begin_checkout") {
      summary.wa++;
      if (pid) summary.byProduct[pid].wa++;
    } else if (row.event_type === "sell_trade_submit") {
      summary.sell++;
    }
  }

  summary.recent = data.slice(0, 12);
  return summary;
}
