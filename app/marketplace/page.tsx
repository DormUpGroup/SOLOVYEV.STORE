"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import { useUI } from "@/components/providers/UIProvider";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MARKETPLACE_BRANDS } from "@/lib/marketplace/types";
import { getNewDrops, getTrending } from "@/lib/marketplace/data";
import { SellTradeModal } from "@/components/modals/SellTradeModal";

const HERO_IMG =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80";

const HOME_CATEGORIES = [
  "streetwear",
  "designer",
  "vintage",
  "sneakers",
  "accessories",
] as const;

export default function MarketplaceHomePage() {
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const { openSellTrade } = useUI();
  const newDrops = getNewDrops(8);
  const trending = getTrending(8);

  return (
    <>
      <section className="mp-hero">
        <div className="mp-hero-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMG} alt="" />
          <div className="mp-hero-scrim" />
        </div>
        <div className="mp-hero-content">
          <h1 className="mp-hero-title">{mp.hero.title}</h1>
          <p className="mp-hero-sub">{mp.hero.subtitle}</p>
          <div className="mp-hero-ctas">
            <Link href="/marketplace/catalog" className="mp-btn mp-btn-primary">
              {mp.hero.shopNow}
            </Link>
            <Link href="/marketplace/sell" className="mp-btn mp-btn-secondary">
              {mp.hero.sellItem}
            </Link>
          </div>
        </div>
      </section>

      <div className="mp-banner">
        <div>
          <strong>{mp.consign.title}</strong>
          <p>{mp.consign.body}</p>
        </div>
        <button
          type="button"
          className="mp-btn mp-btn-secondary"
          onClick={openSellTrade}
        >
          {mp.consign.cta}
        </button>
      </div>

      <section className="mp-section">
        <div className="mp-container">
          <div className="mp-section-head">
            <h2 className="mp-section-title">{mp.sections.newDrops}</h2>
            <Link href="/marketplace/catalog?sort=newest" className="mp-section-link">
              {mp.sections.viewAll}
            </Link>
          </div>
          <div className="mp-grid mp-grid-4">
            {newDrops.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mp-section" style={{ paddingTop: 0 }}>
        <div className="mp-container">
          <div className="mp-section-head">
            <h2 className="mp-section-title">{mp.sections.trending}</h2>
            <Link href="/marketplace/catalog?sort=popular" className="mp-section-link">
              {mp.sections.viewAll}
            </Link>
          </div>
          <div className="mp-grid mp-grid-4">
            {trending.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mp-section" style={{ paddingTop: 0 }}>
        <div className="mp-container">
          <div className="mp-section-head">
            <h2 className="mp-section-title">{mp.sections.brands}</h2>
          </div>
          <div className="mp-chip-row">
            {MARKETPLACE_BRANDS.map((brand) => (
              <Link
                key={brand}
                href={`/marketplace/catalog?brand=${encodeURIComponent(brand)}`}
                className="mp-chip"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mp-section" style={{ paddingTop: 0, paddingBottom: "3.5rem" }}>
        <div className="mp-container">
          <div className="mp-section-head">
            <h2 className="mp-section-title">{mp.sections.categories}</h2>
          </div>
          <div className="mp-chip-row">
            {HOME_CATEGORIES.map((key) => (
              <Link
                key={key}
                href={
                  key === "sneakers"
                    ? "/marketplace/catalog?category=shoes"
                    : key === "accessories"
                      ? "/marketplace/catalog?category=accessories"
                      : `/marketplace/catalog?q=${encodeURIComponent(key)}`
                }
                className="mp-chip"
              >
                {mp.categories[key] ?? key}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SellTradeModal />
    </>
  );
}
