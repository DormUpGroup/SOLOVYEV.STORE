import type {
  MarketplaceFilters,
  MarketplaceListing,
  MarketplaceOffer,
  MarketplaceSort,
} from "./types";
import { getActiveListings, getSellerById } from "./data";

const FAV_KEY = "solovyev_mp_favorites";
const OFFERS_KEY = "solovyev_mp_offers";

export function getDefaultFilters(): MarketplaceFilters {
  return {
    query: "",
    brands: [],
    categories: [],
    sizes: [],
    conditions: [],
    minPrice: null,
    maxPrice: null,
    city: "",
    verifiedOnly: false,
    authenticatedOnly: false,
    sort: "newest",
  };
}

export function filterListings(
  filters: MarketplaceFilters,
  source: MarketplaceListing[] = getActiveListings(),
): MarketplaceListing[] {
  const q = filters.query.trim().toLowerCase();

  let results = source.filter((item) => {
    if (q) {
      const hay = [
        item.name,
        item.brand,
        item.category,
        item.color,
        item.description,
        item.city,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q) && !q.split(/\s+/).every((t) => hay.includes(t))) {
        return false;
      }
    }
    if (filters.brands.length && !filters.brands.includes(item.brand)) {
      return false;
    }
    if (
      filters.categories.length &&
      !filters.categories.includes(item.category)
    ) {
      return false;
    }
    if (filters.sizes.length && !filters.sizes.includes(item.size)) {
      return false;
    }
    if (
      filters.conditions.length &&
      !filters.conditions.includes(item.condition)
    ) {
      return false;
    }
    if (filters.minPrice != null && item.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice != null && item.price > filters.maxPrice) {
      return false;
    }
    if (filters.city && item.city !== filters.city) {
      return false;
    }
    if (filters.authenticatedOnly && !item.authenticated) {
      return false;
    }
    if (filters.verifiedOnly) {
      const seller = getSellerById(item.sellerId);
      if (!seller?.verified) return false;
    }
    return true;
  });

  results = sortListings(results, filters.sort);
  return results;
}

export function sortListings(
  items: MarketplaceListing[],
  sort: MarketplaceSort,
): MarketplaceListing[] {
  const next = [...items];
  switch (sort) {
    case "price_asc":
      return next.sort((a, b) => a.price - b.price);
    case "price_desc":
      return next.sort((a, b) => b.price - a.price);
    case "popular":
      return next.sort((a, b) => b.views - a.views);
    case "updated":
      return next.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case "newest":
    default:
      return next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function formatPrice(amount: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeFavorites(ids: string[]): void {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export function toggleFavorite(id: string): string[] {
  const current = readFavorites();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  writeFavorites(next);
  return next;
}

export function readOffers(): MarketplaceOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addOffer(listingId: string, amount: number): MarketplaceOffer {
  const offer: MarketplaceOffer = {
    id: `offer_${Date.now()}`,
    listingId,
    amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const next = [offer, ...readOffers()];
  localStorage.setItem(OFFERS_KEY, JSON.stringify(next));
  return offer;
}
