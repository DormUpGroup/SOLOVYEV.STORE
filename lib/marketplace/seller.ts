export interface MarketplaceSellerAccount {
  isSeller: boolean;
  username: string;
  displayName: string;
  city: string;
  bio: string;
  phone: string;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  agreementAccepted: boolean;
  /** Level 2 badge — unlocked after mock “verified” or future deals */
  verifiedSeller: boolean;
  createdAt: string;
}

const SELLER_KEY = "solovyev_mp_seller";

export const MOCK_OTP = "1234";

export function emptySellerAccount(): MarketplaceSellerAccount {
  return {
    isSeller: false,
    username: "",
    displayName: "",
    city: "",
    bio: "",
    phone: "",
    email: "",
    emailVerified: false,
    phoneVerified: false,
    agreementAccepted: false,
    verifiedSeller: false,
    createdAt: "",
  };
}

export function readSellerAccount(): MarketplaceSellerAccount {
  if (typeof window === "undefined") return emptySellerAccount();
  try {
    const raw = localStorage.getItem(SELLER_KEY);
    if (!raw) return emptySellerAccount();
    const parsed = JSON.parse(raw) as Partial<MarketplaceSellerAccount>;
    return { ...emptySellerAccount(), ...parsed };
  } catch {
    return emptySellerAccount();
  }
}

export function writeSellerAccount(account: MarketplaceSellerAccount): void {
  localStorage.setItem(SELLER_KEY, JSON.stringify(account));
  window.dispatchEvent(new Event("mp-seller"));
}

export function canPublishListings(account: MarketplaceSellerAccount): boolean {
  return (
    account.isSeller &&
    account.phoneVerified &&
    account.emailVerified &&
    account.agreementAccepted &&
    Boolean(account.username.trim()) &&
    Boolean(account.city.trim())
  );
}

export function clearSellerAccount(): void {
  localStorage.removeItem(SELLER_KEY);
  window.dispatchEvent(new Event("mp-seller"));
  try {
    localStorage.removeItem("solovyev_mp_my_listings");
    window.dispatchEvent(new Event("mp-listings"));
  } catch {
    /* ignore */
  }
}
