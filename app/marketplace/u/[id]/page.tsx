"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getListingsBySeller, getSellerById } from "@/lib/marketplace/data";

export default function MarketplaceSellerProfilePage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const seller = getSellerById(id);
  const listings = getListingsBySeller(id);
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const [tab, setTab] = useState<"active" | "sold" | "reviews">("active");

  if (!seller) {
    return <div className="mp-container mp-empty">Not found</div>;
  }

  const active = listings.filter((l) => l.status === "active");
  const sold = listings.filter((l) => l.status === "sold");
  const shown = tab === "sold" ? sold : active;

  return (
    <div className="mp-container">
      <div className="mp-profile-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={seller.avatar} alt="" />
        <div>
          <h1 style={{ fontFamily: "var(--mp-display)", fontSize: "2rem", letterSpacing: "0.04em" }}>
            @{seller.username}
          </h1>
          {seller.verified ? (
            <div className="mp-verified">{mp.item.verifiedSeller}</div>
          ) : null}
          <p style={{ color: "var(--mp-text-muted)", marginTop: "0.5rem", lineHeight: 1.45 }}>
            {seller.bio}
          </p>
          <p style={{ color: "var(--mp-text-dim)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
            {seller.city}
          </p>
          <div className="mp-profile-stats">
            <div>
              <strong>{seller.rating.toFixed(1)}</strong>
              <span>{mp.item.rating}</span>
            </div>
            <div>
              <strong>{seller.salesCount}</strong>
              <span>{mp.item.sales}</span>
            </div>
            <div>
              <strong>{active.length}</strong>
              <span>{mp.item.activeListings}</span>
            </div>
            <div>
              <strong>{seller.followers ?? 0}</strong>
              <span>{mp.profile.followers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mp-tabs">
        <button
          type="button"
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          {mp.profile.active} ({active.length})
        </button>
        <button
          type="button"
          className={tab === "sold" ? "active" : ""}
          onClick={() => setTab("sold")}
        >
          {mp.profile.sold} ({sold.length})
        </button>
        <button
          type="button"
          className={tab === "reviews" ? "active" : ""}
          onClick={() => setTab("reviews")}
        >
          {mp.profile.reviews}
        </button>
      </div>

      {tab === "reviews" ? (
        <div className="mp-empty">{mp.me.emptySoon}</div>
      ) : shown.length === 0 ? (
        <div className="mp-empty">{mp.profile.noListings}</div>
      ) : (
        <div className="mp-grid" style={{ paddingBottom: "3rem" }}>
          {shown.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}
