import type { ClothingType } from "@/lib/clothing-types";

export type { ClothingType };
export type ProductCategory = "sneakers" | "clothing" | "accessories";
export type ProductStatus =
  | "available"
  | "reserved"
  | "sold"
  | "new_drop"
  | "draft"
  | "made_to_order"
  | "brand_new";

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
  announcements?: {
    freeShipping: string;
    authenticity: string;
    newDrops: string;
  };
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  objectPosition: string;
  cropZoom: number;
  cropMode: "cover" | "free";
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  category: ProductCategory;
  clothingType?: ClothingType;
  price: number;
  originalPrice?: number;
  condition: string;
  brand: string;
  badge: string;
  sizes: string[];
  img: string;
  images?: ProductImage[];
  status: ProductStatus;
  sold?: boolean;
  description?: string;
  instagramUrl?: string;
  source?: "instagram" | "demo" | "admin";
  sortOrder?: number;
  updatedAt?: string;
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

export interface CustomerProfile {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  marketingEmailOptIn?: boolean;
  marketingEmailOptInAt?: string | null;
  createdAt: string;
}

export type OrderStatus =
  | "pending_whatsapp"
  | "in_chat"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled";

export interface CustomerOrderItem {
  id: number;
  productId?: number;
  productTitle: string;
  productSlug: string;
  productImage: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerOrder {
  id: string;
  orderRef: string;
  status: OrderStatus;
  currencyCode: string;
  currencySymbol: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  createdAt: string;
  items: CustomerOrderItem[];
}

export interface ActiveFilters {
  category: "all" | ProductCategory;
  clothingType: "" | ClothingType;
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
