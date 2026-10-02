"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getListingById } from "@/lib/marketplace/data";
import {
  formatPrice,
  readFavorites,
  readOffers,
} from "@/lib/marketplace/utils";
import {
  canPublishListings,
  clearSellerAccount,
  emptySellerAccount,
  readSellerAccount,
  type MarketplaceSellerAccount,
} from "@/lib/marketplace/seller";
import {
  myListingToMarketplace,
  readMyListings,
  type MyListing,
} from "@/lib/marketplace/my-listings";
import type { MarketplaceOffer } from "@/lib/marketplace/types";

type Tab =
  | "seller"
  | "favorites"
  | "offers"
  | "purchases"
  | "messages"
  | "reviews";

export default function MarketplaceMePage() {
  const { dict, locale } = useI18n();
  const mp = dict.marketplace;
  const [tab, setTab] = useState<Tab>("seller");
  const [favIds, setFavIds] = useState<string[]>([]);
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [seller, setSeller] = useState<MarketplaceSellerAccount>(
    emptySellerAccount,
  );

  useEffect(() => {
    const refresh = () => {
      setFavIds(readFavorites());
      setOffers(readOffers());
      setSeller(readSellerAccount());
      setMyListings(readMyListings());
    };
    refresh();
    window.addEventListener("mp-seller", refresh);
    window.addEventListener("mp-favorites", refresh);
    window.addEventListener("mp-listings", refresh);
    return () => {
      window.removeEventListener("mp-seller", refresh);
      window.removeEventListener("mp-favorites", refresh);
      window.removeEventListener("mp-listings", refresh);
    };
  }, [tab]);

  const favListings = favIds
    .map((id) => getListingById(id))
    .filter(Boolean);

  const isSeller = canPublishListings(seller);
  const activeMine = myListings.filter((l) => l.status === "active");
  const soldMine = myListings.filter((l) => l.status === "sold");

  return (
    <div className="mp-container" style={{ paddingBottom: "3rem" }}>
      <h1
        style={{
          fontFamily: "var(--mp-display)",
          fontSize: "2.2rem",
          letterSpacing: "0.04em",
          padding: "1.75rem 0 1rem",
        }}
      >
        {mp.me.title}
      </h1>

      <div className="mp-tabs" style={{ overflowX: "auto" }}>
        {(
          [
            ["seller", mp.me.sellerTab],
            ["favorites", mp.me.favorites],
            ["offers", mp.me.offers],
            ["purchases", mp.me.purchases],
            ["messages", mp.me.messages],
            ["reviews", mp.me.reviews],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "seller" && (
        <div className="mp-seller-card-panel">
          {!isSeller ? (
            <div className="mp-empty">
              <p>{mp.me.notSeller}</p>
              <Link
                href="/marketplace/become-seller"
                className="mp-btn mp-btn-primary"
                style={{ marginTop: "1rem" }}
              >
                {mp.me.becomeCta}
              </Link>
            </div>
          ) : (
            <>
              <div className="mp-seller-status">
                <div>
                  <p className="mp-card-brand">{mp.me.sellerStatus}</p>
                  <h2 style={{ fontFamily: "var(--mp-display)", fontSize: "1.8rem" }}>
                    @{seller.username}
                  </h2>
                  <p style={{ color: "var(--mp-text-muted)", marginTop: 4 }}>
                    {seller.displayName}
                  </p>
                  <div className="mp-verified" style={{ marginTop: 8 }}>
                    {seller.verifiedSeller
                      ? mp.me.verifiedBadge
                      : mp.me.unverifiedBadge}
                  </div>
                  <p
                    style={{
                      marginTop: 10,
                      color: "var(--mp-accent)",
                      fontSize: "0.8rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {mp.me.canList} · {mp.me.level1}
                  </p>
                </div>
                <div className="mp-seller-facts">
                  <div>
                    <strong>{mp.me.cityLabel}</strong>
                    <span>{seller.city}</span>
                  </div>
                  <div>
                    <strong>{mp.me.phoneLabel}</strong>
                    <span>{seller.phone}</span>
                  </div>
                  <div>
                    <strong>{mp.me.emailLabel}</strong>
                    <span>{seller.email}</span>
                  </div>
                </div>
              </div>
              {seller.bio ? (
                <p style={{ color: "var(--mp-text-muted)", marginBottom: "1.25rem" }}>
                  {seller.bio}
                </p>
              ) : null}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/marketplace/sell" className="mp-btn mp-btn-primary">
                  {mp.nav.sell}
                </Link>
                <button
                  type="button"
                  className="mp-btn mp-btn-ghost"
                  onClick={() => {
                    clearSellerAccount();
                    setSeller(emptySellerAccount());
                    setMyListings([]);
                  }}
                >
                  {mp.me.resetDemo}
                </button>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <div className="mp-section-head">
                  <h2 className="mp-section-title" style={{ fontSize: "1.6rem" }}>
                    {mp.me.myListings}
                  </h2>
                  <span className="mp-results-count">
                    {activeMine.length} {mp.profile.active.toLowerCase()}
                    {soldMine.length
                      ? ` · ${soldMine.length} ${mp.profile.sold.toLowerCase()}`
                      : ""}
                  </span>
                </div>
                {myListings.length === 0 ? (
                  <div className="mp-empty">
                    <p>{mp.me.emptyListings}</p>
                    <Link
                      href="/marketplace/sell"
                      className="mp-btn mp-btn-secondary"
                      style={{ marginTop: "1rem" }}
                    >
                      {mp.nav.sell}
                    </Link>
                  </div>
                ) : (
                  <div className="mp-grid">
                    {myListings.map((item) => (
                      <ListingCard
                        key={item.id}
                        listing={myListingToMarketplace(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "favorites" &&
        (favListings.length === 0 ? (
          <div className="mp-empty">
            <p>{mp.me.emptyFavorites}</p>
            <Link
              href="/marketplace/catalog"
              className="mp-btn mp-btn-secondary"
              style={{ marginTop: "1rem" }}
            >
              {mp.nav.shop}
            </Link>
          </div>
        ) : (
          <div className="mp-grid">
            {favListings.map((item) =>
              item ? <ListingCard key={item.id} listing={item} /> : null,
            )}
          </div>
        ))}

      {tab === "offers" &&
        (offers.length === 0 ? (
          <div className="mp-empty">{mp.me.emptyOffers}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {offers.map((offer) => {
              const listing = getListingById(offer.listingId);
              return (
                <Link
                  key={offer.id}
                  href={
                    listing
                      ? `/marketplace/item/${listing.id}`
                      : "/marketplace/catalog"
                  }
                  style={{
                    display: "block",
                    padding: "1rem",
                    border: "1px solid var(--mp-border)",
                    background: "var(--mp-bg-elevated)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <strong>{formatPrice(offer.amount, locale)}</strong>
                  <span style={{ color: "var(--mp-text-muted)" }}>
                    {" "}
                    {mp.me.offerOn} {listing?.name ?? offer.listingId}
                  </span>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: "0.75rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--mp-accent)",
                    }}
                  >
                    {mp.me.offerPending}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

      {(tab === "purchases" || tab === "messages" || tab === "reviews") && (
        <div className="mp-empty">{mp.me.emptySoon}</div>
      )}
    </div>
  );
}
