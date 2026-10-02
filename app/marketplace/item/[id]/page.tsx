"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useMarketplaceToast } from "@/components/marketplace/MarketplaceToast";
import { getListingById, getSellerById } from "@/lib/marketplace/data";
import {
  getMyListingById,
  myListingToMarketplace,
} from "@/lib/marketplace/my-listings";
import { readSellerAccount } from "@/lib/marketplace/seller";
import {
  addOffer,
  formatPrice,
  readFavorites,
  toggleFavorite,
} from "@/lib/marketplace/utils";
import type {
  MarketplaceListing,
  MarketplaceSeller,
} from "@/lib/marketplace/types";

export default function MarketplaceItemPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { dict, locale } = useI18n();
  const mp = dict.marketplace;
  const { showToast } = useMarketplaceToast();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [seller, setSeller] = useState<MarketplaceSeller | null>(null);
  const [isOwn, setIsOwn] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");

  useEffect(() => {
    const mine = getMyListingById(id);
    if (mine) {
      const mapped = myListingToMarketplace(mine);
      const account = readSellerAccount();
      setListing(mapped);
      setIsOwn(true);
      setSeller({
        id: "me",
        username: mine.sellerUsername || account.username || "you",
        displayName: account.displayName || mine.sellerUsername || "You",
        bio: account.bio || "",
        city: account.city || mine.city,
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        verified: account.verifiedSeller,
        rating: 5,
        salesCount: 0,
        activeListings: 1,
      });
    } else {
      const catalog = getListingById(id);
      setListing(catalog ?? null);
      setIsOwn(false);
      setSeller(catalog ? getSellerById(catalog.sellerId) ?? null : null);
    }
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (listing) {
      setFavorited(readFavorites().includes(listing.id));
      setOfferAmount(String(Math.round(listing.price * 0.9)));
      setActiveImg(0);
    }
  }, [listing]);

  if (!ready) {
    return <div className="mp-container mp-empty">…</div>;
  }

  if (!listing || !seller) {
    return (
      <div className="mp-container mp-empty">
        <p>Not found</p>
        <Link href="/marketplace/catalog" className="mp-btn mp-btn-secondary">
          {mp.nav.shop}
        </Link>
      </div>
    );
  }

  const onFavorite = () => {
    const next = toggleFavorite(listing.id);
    setFavorited(next.includes(listing.id));
    window.dispatchEvent(new Event("mp-favorites"));
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(mp.item.shared);
    } catch {
      showToast(mp.item.demoToast);
    }
  };

  const onOfferSubmit = () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) return;
    addOffer(listing.id, amount);
    setOfferOpen(false);
    showToast(mp.item.offerSent);
  };

  const sellerHref = isOwn ? "/marketplace/me" : `/marketplace/u/${seller.id}`;

  return (
    <div className="mp-container">
      <button
        type="button"
        className="mp-back"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push(isOwn ? "/marketplace/me" : "/marketplace/catalog");
          }
        }}
      >
        <span aria-hidden>←</span>
        {mp.sell.back}
      </button>

      <div className="mp-pdp">
        <div className="mp-gallery">
          <div className="mp-gallery-thumbs">
            {listing.images.map((src, i) => (
              <button
                key={`${src.slice(0, 24)}-${i}`}
                type="button"
                className={i === activeImg ? "active" : ""}
                onClick={() => setActiveImg(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mp-gallery-main"
            onClick={() => setLightbox(true)}
            aria-label="Zoom"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.images[activeImg]} alt={listing.name} />
          </button>
        </div>

        <div className="mp-pdp-info">
          <p className="mp-pdp-brand">{listing.brand}</p>
          <h1>{listing.name}</h1>
          <p className="mp-pdp-price">{formatPrice(listing.price, locale)}</p>

          <div className={`mp-trust${listing.authenticated ? " ok" : ""}`}>
            {listing.authenticated
              ? mp.item.authenticated
              : mp.item.authAvailable}
          </div>

          <dl className="mp-pdp-meta">
            <dt>{mp.item.size}</dt>
            <dd>{listing.size}</dd>
            <dt>{mp.item.condition}</dt>
            <dd>{mp.conditions[listing.condition]}</dd>
            <dt>{mp.item.color}</dt>
            <dd>{listing.color}</dd>
            <dt>{mp.item.location}</dt>
            <dd>{listing.city}</dd>
          </dl>

          <p className="mp-pdp-desc">{listing.description}</p>

          <Link href={sellerHref} className="mp-seller-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seller.avatar} alt="" />
            <div>
              <strong>@{seller.username}</strong>
              {seller.verified ? (
                <div className="mp-verified">{mp.item.verifiedSeller}</div>
              ) : null}
              <div className="mp-seller-meta">
                ★ {seller.rating.toFixed(1)} · {seller.salesCount}{" "}
                {mp.item.sales} · {seller.activeListings}{" "}
                {mp.item.activeListings}
              </div>
            </div>
          </Link>

          <div className="mp-pdp-actions">
            {isOwn ? (
              <Link href="/marketplace/me" className="mp-btn mp-btn-primary mp-btn-block">
                {mp.sell.viewMyListings}
              </Link>
            ) : listing.status === "sold" ? (
              <button type="button" className="mp-btn mp-btn-primary" disabled>
                {mp.item.sold}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="mp-btn mp-btn-primary mp-btn-block"
                  onClick={() =>
                    router.push(`/marketplace/checkout/${listing.id}`)
                  }
                >
                  {mp.item.buyNow}
                </button>
                <button
                  type="button"
                  className="mp-btn mp-btn-secondary mp-btn-block"
                  onClick={() => setOfferOpen(true)}
                >
                  {mp.item.makeOffer}
                </button>
              </>
            )}
            <div className="mp-pdp-row">
              <button
                type="button"
                className="mp-btn mp-btn-secondary"
                onClick={onFavorite}
              >
                {favorited ? `♥ ${mp.item.favorited}` : `♡ ${mp.item.favorite}`}
              </button>
              <button
                type="button"
                className="mp-btn mp-btn-secondary"
                onClick={onShare}
              >
                {mp.item.share}
              </button>
            </div>
            {!isOwn ? (
              <button
                type="button"
                className="mp-btn mp-btn-ghost"
                onClick={() => showToast(mp.item.reported)}
              >
                {mp.item.report}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {lightbox ? (
        <div className="mp-lightbox" role="dialog" aria-modal="true">
          <button
            type="button"
            className="mp-btn mp-btn-secondary mp-lightbox-close"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.images[activeImg]} alt={listing.name} />
        </div>
      ) : null}

      {offerOpen && !isOwn ? (
        <div className="mp-modal-backdrop" role="dialog" aria-modal="true">
          <div className="mp-modal">
            <h2>{mp.item.offerTitle}</h2>
            <p>
              {mp.item.offerHint.replace(
                "{price}",
                formatPrice(listing.price, locale),
              )}
            </p>
            <label className="mp-filter-group">
              <span style={{ display: "block", marginBottom: 8 }}>
                {mp.item.offerAmount}
              </span>
              <input
                className="mp-input"
                type="number"
                inputMode="numeric"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
              />
            </label>
            <div className="mp-modal-actions">
              <button
                type="button"
                className="mp-btn mp-btn-secondary"
                onClick={() => setOfferOpen(false)}
              >
                {mp.item.offerCancel}
              </button>
              <button
                type="button"
                className="mp-btn mp-btn-primary"
                onClick={onOfferSubmit}
              >
                {mp.item.offerSubmit}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
