export type ProductCategory = "sneakers" | "clothing" | "accessories";
export type ProductStatus = "available" | "reserved" | "sold" | "new_drop";

export interface StoreConfig {
  storeName: string;
  contacts: {
    whatsappPhone: string;
    instagramUrl: string;
    managerName: string;
  };
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  currency: {
    code: string;
    symbol: string;
  };
  categories: Array<{ id: ProductCategory; label: string }>;
  badges: Array<{ id: string; label: string }>;
  sizes: {
    standard: string[];
    clothingOrder: string[];
  };
  images: {
    heroPhoto: string;
    heroVideo?: string;
    instagramPosts: string[];
  };
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  condition: string;
  brand: string;
  badge: string;
  sizes: string[];
  img: string;
  status: ProductStatus;
  sold?: boolean;
  description?: string;
  instagramUrl?: string;
  source?: "instagram" | "demo";
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CartItem {
  id: number;
  size: string;
  quantity: number;
  qty: number;
}

export interface ActiveFilters {
  category: "all" | ProductCategory;
  brand: string;
  search: string;
  size: string;
  sort: "" | "low-to-high" | "high-to-low";
}

export interface SellTradeFormData {
  category: string;
  name: string;
  size: string;
  condition: string;
  price: string;
  notes: string;
  website?: string;
}
