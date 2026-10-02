export type MarketplaceCategory =
  | "tshirts"
  | "shirts"
  | "hoodies"
  | "jackets"
  | "pants"
  | "jeans"
  | "shorts"
  | "shoes"
  | "bags"
  | "accessories"
  | "other";

export type MarketplaceCondition =
  | "new"
  | "like_new"
  | "very_good"
  | "good"
  | "used";

export type MarketplaceSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "updated";

export interface MarketplaceSeller {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  city: string;
  avatar: string;
  verified: boolean;
  rating: number;
  salesCount: number;
  activeListings: number;
  followers?: number;
}

export interface MarketplaceListing {
  id: string;
  slug: string;
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
  sellerId: string;
  authenticated: boolean;
  views: number;
  favorites: number;
  createdAt: string;
  updatedAt: string;
  status: "active" | "sold";
  shipping: boolean;
  pickup: boolean;
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  amount: number;
  status: "pending" | "accepted" | "rejected" | "counter";
  createdAt: string;
}

export interface MarketplaceFilters {
  query: string;
  brands: string[];
  categories: MarketplaceCategory[];
  sizes: string[];
  conditions: MarketplaceCondition[];
  minPrice: number | null;
  maxPrice: number | null;
  city: string;
  verifiedOnly: boolean;
  authenticatedOnly: boolean;
  sort: MarketplaceSort;
}

export const MARKETPLACE_BRANDS = [
  "Stone Island",
  "Supreme",
  "Nike",
  "Jordan",
  "Bape",
  "Off-White",
  "Carhartt",
  "Ralph Lauren",
  "Chrome Hearts",
  "Dior",
  "Prada",
  "Gucci",
  "Louis Vuitton",
] as const;

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  "tshirts",
  "shirts",
  "hoodies",
  "jackets",
  "pants",
  "jeans",
  "shorts",
  "shoes",
  "bags",
  "accessories",
  "other",
];

export const MARKETPLACE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const MARKETPLACE_SHOE_SIZES = [
  "EU 39",
  "EU 40",
  "EU 41",
  "EU 42",
  "EU 43",
  "EU 44",
  "EU 45",
  "EU 46",
] as const;

export const MARKETPLACE_CONDITIONS: MarketplaceCondition[] = [
  "new",
  "like_new",
  "very_good",
  "good",
  "used",
];

export const MARKETPLACE_CITIES = [
  "Tel Aviv",
  "Haifa",
  "Jerusalem",
  "Beer Sheva",
  "Netanya",
  "Herzliya",
  "Ramat Gan",
] as const;

export const BRAND_NAME = "SOLOVYEV RESALE";
