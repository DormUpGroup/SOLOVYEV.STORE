import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceListing,
} from "./types";
import { readSellerAccount } from "./seller";

const LISTINGS_KEY = "solovyev_mp_my_listings";

export type MyListingStatus = "active" | "sold" | "draft";

export interface MyListing {
  id: string;
  brand: string;
  name: string;
  category: MarketplaceCategory;
  size: string;
  condition: MarketplaceCondition;
  color: string;
  description: string;
  price: number;
  city: string;
  images: string[];
  status: MyListingStatus;
  shipping: boolean;
  pickup: boolean;
  createdAt: string;
  updatedAt: string;
  sellerUsername: string;
}

export function readMyListings(): MyListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMyListings(items: MyListing[]): void {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("mp-listings"));
}

export function getMyListingById(id: string): MyListing | undefined {
  return readMyListings().find((l) => l.id === id);
}

export function addMyListing(
  input: Omit<MyListing, "id" | "createdAt" | "updatedAt" | "sellerUsername">,
): MyListing {
  const seller = readSellerAccount();
  const now = new Date().toISOString();
  const listing: MyListing = {
    ...input,
    id: `my_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    sellerUsername: seller.username || "you",
  };
  writeMyListings([listing, ...readMyListings()]);
  return listing;
}

export function clearMyListings(): void {
  localStorage.removeItem(LISTINGS_KEY);
  window.dispatchEvent(new Event("mp-listings"));
}

export function myListingToMarketplace(
  item: MyListing,
): MarketplaceListing {
  return {
    id: item.id,
    slug: item.id,
    brand: item.brand,
    name: item.name,
    category: item.category,
    size: item.size,
    condition: item.condition,
    color: item.color || "—",
    description: item.description,
    price: item.price,
    city: item.city,
    images: item.images.length
      ? item.images
      : [
          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
        ],
    sellerId: "me",
    authenticated: false,
    views: 0,
    favorites: 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    status: item.status === "draft" ? "active" : item.status,
    shipping: item.shipping,
    pickup: item.pickup,
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
