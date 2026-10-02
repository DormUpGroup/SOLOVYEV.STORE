"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import type { MarketplaceListing } from "@/lib/marketplace/types";
import { formatPrice } from "@/lib/marketplace/utils";

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const { dict, locale } = useI18n();
  const mp = dict.marketplace;

  return (
    <Link href={`/marketplace/item/${listing.id}`} className="mp-card">
      <div className="mp-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.images[0]} alt="" loading="lazy" />
        <div className="mp-card-badges">
          {listing.authenticated ? (
            <span className="mp-pill mp-pill-accent">{mp.item.authenticated}</span>
          ) : null}
          {listing.status === "sold" ? (
            <span className="mp-pill">{mp.item.sold}</span>
          ) : null}
        </div>
      </div>
      <div className="mp-card-body">
        <span className="mp-card-brand">{listing.brand}</span>
        <span className="mp-card-name">{listing.name}</span>
        <div className="mp-card-meta">
          <span className="mp-card-price">
            {formatPrice(listing.price, locale)}
          </span>
          <span className="mp-card-size">{listing.size}</span>
        </div>
      </div>
    </Link>
  );
}
