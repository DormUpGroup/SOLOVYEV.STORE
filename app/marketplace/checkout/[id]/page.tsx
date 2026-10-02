"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useMarketplaceToast } from "@/components/marketplace/MarketplaceToast";
import { getListingById } from "@/lib/marketplace/data";
import { formatPrice } from "@/lib/marketplace/utils";

export default function MarketplaceCheckoutPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const listing = getListingById(id);
  const { dict, locale } = useI18n();
  const mp = dict.marketplace;
  const { showToast } = useMarketplaceToast();
  const [method, setMethod] = useState<"card" | "apple" | "google">("card");
  const [fulfillment, setFulfillment] = useState<"shipping" | "pickup">(
    listing?.pickup ? "pickup" : "shipping",
  );

  if (!listing) {
    return <div className="mp-container mp-empty">Not found</div>;
  }

  const shippingFee = fulfillment === "pickup" ? 0 : 35;
  const total = listing.price + shippingFee;

  return (
    <div className="mp-container">
      <div className="mp-checkout">
        <h1
          style={{
            fontFamily: "var(--mp-display)",
            fontSize: "2rem",
            letterSpacing: "0.04em",
            marginBottom: "1.5rem",
          }}
        >
          {mp.checkout.title}
        </h1>

        <div className="mp-checkout-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.images[0]} alt="" />
          <div>
            <p className="mp-card-brand">{listing.brand}</p>
            <p style={{ margin: "0.25rem 0" }}>{listing.name}</p>
            <p className="mp-card-size">{listing.size}</p>
            <p style={{ fontWeight: 700, marginTop: "0.5rem" }}>
              {formatPrice(listing.price, locale)}
            </p>
          </div>
        </div>

        <div className="mp-filter-group" style={{ marginBottom: "1.25rem" }}>
          <legend>{mp.checkout.shipping}</legend>
          {listing.pickup ? (
            <label className="mp-check">
              <input
                type="radio"
                checked={fulfillment === "pickup"}
                onChange={() => setFulfillment("pickup")}
              />
              {mp.sell.pickup}
            </label>
          ) : null}
          {listing.shipping ? (
            <label className="mp-check">
              <input
                type="radio"
                checked={fulfillment === "shipping"}
                onChange={() => setFulfillment("shipping")}
              />
              {mp.sell.shipping}
            </label>
          ) : null}
        </div>

        <div className="mp-checkout-totals">
          <div>
            <span>{mp.checkout.product}</span>
            <span>{formatPrice(listing.price, locale)}</span>
          </div>
          <div>
            <span>{mp.checkout.shipping}</span>
            <span>
              {shippingFee === 0
                ? mp.checkout.freePickup
                : mp.checkout.shippingFee}
            </span>
          </div>
          <div className="total">
            <span>{mp.checkout.total}</span>
            <span>{formatPrice(total, locale)}</span>
          </div>
        </div>

        <div className="mp-filter-group">
          <legend>{mp.checkout.payment}</legend>
          <div className="mp-pay-methods">
            <label className="mp-check">
              <input
                type="radio"
                checked={method === "card"}
                onChange={() => setMethod("card")}
              />
              {mp.checkout.card}
            </label>
            <label className="mp-check">
              <input
                type="radio"
                checked={method === "apple"}
                onChange={() => setMethod("apple")}
              />
              {mp.checkout.applePay}
            </label>
            <label className="mp-check">
              <input
                type="radio"
                checked={method === "google"}
                onChange={() => setMethod("google")}
              />
              {mp.checkout.googlePay}
            </label>
          </div>
        </div>

        <button
          type="button"
          className="mp-btn mp-btn-primary mp-btn-block"
          onClick={() => showToast(mp.checkout.comingSoon)}
        >
          {mp.checkout.pay}
        </button>
        <p
          className="mp-demo-note"
          style={{ textAlign: "center", marginTop: "1rem" }}
        >
          {mp.demoNote}
        </p>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href={`/marketplace/item/${listing.id}`} className="mp-section-link">
            ← {listing.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
