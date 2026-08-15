import configData from "@/data/config.json";
import type { StoreConfig } from "@/lib/types";

export const DEFAULT_STORE_CONFIG = configData as StoreConfig;

/** Legacy CMS/DB paths still point at the old multi-MB PNG. */
function resolveHeroPhoto(url?: string | null): string {
  const fallback = DEFAULT_STORE_CONFIG.images.heroPhoto;
  if (!url?.trim()) return fallback;
  if (url === "/assets/hiro_photo.png") return fallback;
  return url;
}

export function normalizeStoreConfig(
  partial?: Partial<StoreConfig> | null,
): StoreConfig {
  const base = partial ?? {};

  return {
    storeName: base.storeName ?? DEFAULT_STORE_CONFIG.storeName,
    contacts: {
      whatsappPhone:
        base.contacts?.whatsappPhone ?? DEFAULT_STORE_CONFIG.contacts.whatsappPhone,
      instagramUrl:
        base.contacts?.instagramUrl ?? DEFAULT_STORE_CONFIG.contacts.instagramUrl,
      managerName:
        base.contacts?.managerName ?? DEFAULT_STORE_CONFIG.contacts.managerName,
    },
    location: {
      ...DEFAULT_STORE_CONFIG.location,
      ...base.location,
    },
    currency: {
      ...DEFAULT_STORE_CONFIG.currency,
      ...base.currency,
    },
    categories:
      base.categories?.length ? base.categories : DEFAULT_STORE_CONFIG.categories,
    badges: base.badges?.length ? base.badges : DEFAULT_STORE_CONFIG.badges,
    sizes: {
      standard: base.sizes?.standard ?? DEFAULT_STORE_CONFIG.sizes.standard,
      clothingOrder:
        base.sizes?.clothingOrder ?? DEFAULT_STORE_CONFIG.sizes.clothingOrder,
    },
    images: {
      heroPhoto: resolveHeroPhoto(base.images?.heroPhoto),
      heroVideo: base.images?.heroVideo ?? DEFAULT_STORE_CONFIG.images.heroVideo,
      instagramPosts:
        base.images?.instagramPosts ?? DEFAULT_STORE_CONFIG.images.instagramPosts,
    },
    announcements: base.announcements ?? DEFAULT_STORE_CONFIG.announcements,
  };
}
