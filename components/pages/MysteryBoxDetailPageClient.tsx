"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { useI18n } from "@/components/providers/I18nProvider";

type BoxVariant = "medium" | "large";

const ASSETS: Record<
  BoxVariant,
  { contentsSrc: string; boxSrc: string; otherHref: string }
> = {
  medium: {
    contentsSrc: "/assets/mystery-box/medium-contents.webp",
    boxSrc: "/assets/mystery-box/medium-box.webp",
    otherHref: "/mystery-box/large",
  },
  large: {
    contentsSrc: "/assets/mystery-box/large-contents.webp",
    boxSrc: "/assets/mystery-box/large-box.webp",
    otherHref: "/mystery-box/medium",
  },
};

function MysteryBoxCarousel({
  slides,
}: {
  slides: { src: string; alt: string }[];
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  return (
    <div className="mystery-box-carousel">
      <div className="mystery-box-carousel-viewport">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`mystery-box-carousel-slide${i === index ? " is-active" : ""}`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              className="mystery-box-img"
              priority={i === 0}
            />
          </div>
        ))}

        <button
          type="button"
          className="mystery-box-carousel-arrow mystery-box-carousel-arrow--prev"
          onClick={() => go(-1)}
          aria-label="Previous photo"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M15 5L8 12l7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="mystery-box-carousel-arrow mystery-box-carousel-arrow--next"
          onClick={() => go(1)}
          aria-label="Next photo"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="mystery-box-carousel-dots" role="tablist" aria-label="Photos">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Photo ${i + 1}`}
            className={`mystery-box-carousel-dot${i === index ? " is-active" : ""}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

export function MysteryBoxDetailPageClient({ variant }: { variant: BoxVariant }) {
  const { dict } = useI18n();
  const mb = dict.mysteryBox;
  const box = mb[variant];
  const assets = ASSETS[variant];
  const otherLabel =
    variant === "medium" ? mb.viewOtherLarge : mb.viewOtherMedium;

  const slides = [
    { src: assets.contentsSrc, alt: box.contentsAlt },
    { src: assets.boxSrc, alt: box.boxAlt },
  ];

  return (
    <>
      <Header />
      <main className="subpage-main mystery-box-page mystery-box-detail">
        <div className="subpage-container mystery-box-container">
          <div className="mystery-box-detail-nav">
            <Link href="/mystery-box" className="back-link">
              {mb.backToMysteryBox}
            </Link>
            <Link href={assets.otherHref} className="mystery-box-other-link">
              {otherLabel}
            </Link>
          </div>

          <article className="mystery-box-block mystery-box-block--solo">
            <MysteryBoxCarousel slides={slides} />

            <div className="mystery-box-copy">
              <div className="mystery-box-copy-top">
                <h1 className="mystery-box-block-title">{box.title}</h1>
                <span className="mystery-box-sold-out" aria-label={mb.soldOut}>
                  {mb.soldOut}
                </span>
              </div>

              <p className="mystery-box-intro">{box.intro}</p>
              <p className="mystery-box-includes-lead">{box.includesLead}</p>
              <ul className="mystery-box-items">
                {box.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className="mystery-box-auth">{mb.authenticity}</p>
              <p className="mystery-box-auth-guarantee">
                {mb.authenticityGuaranteed}
              </p>
              <p className="mystery-box-disclaimer">{mb.disclaimer}</p>
              <p className="mystery-box-tagline">{mb.tagline}</p>
            </div>
          </article>
        </div>
      </main>
      <MinimalFooter />
      <ToastNotification />
      <SellTradeModal />
      <FaqModal />
      <QuickViewModal />
      <CartDrawer />
    </>
  );
}
