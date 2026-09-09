"use client";

import Image from "next/image";
import Link from "next/link";
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

export function MysteryBoxDetailPageClient({ variant }: { variant: BoxVariant }) {
  const { dict } = useI18n();
  const mb = dict.mysteryBox;
  const box = mb[variant];
  const assets = ASSETS[variant];
  const otherLabel =
    variant === "medium" ? mb.viewOtherLarge : mb.viewOtherMedium;

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
            <div className="mystery-box-media">
              <div className="mystery-box-media-main">
                <Image
                  src={assets.contentsSrc}
                  alt={box.contentsAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 60vw"
                  className="mystery-box-img"
                  priority
                />
              </div>
              <div className="mystery-box-media-side">
                <Image
                  src={assets.boxSrc}
                  alt={box.boxAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 60vw"
                  className="mystery-box-img"
                />
              </div>
            </div>

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
