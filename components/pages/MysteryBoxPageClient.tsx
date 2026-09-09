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

function MysteryBoxPreview({
  href,
  src,
  label,
  alt,
  stagger,
  priority,
}: {
  href: string;
  src: string;
  label: string;
  alt: string;
  stagger?: "up" | "down";
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mystery-box-preview${stagger ? ` mystery-box-preview--${stagger}` : ""}`}
    >
      <span className="mystery-box-preview-media">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 700px) 90vw, 480px"
          className="mystery-box-preview-img"
          priority={priority}
        />
        <span className="mystery-box-preview-shade" aria-hidden="true" />
        <span className="mystery-box-preview-label">{label}</span>
      </span>
    </Link>
  );
}

export function MysteryBoxPageClient() {
  const { dict } = useI18n();
  const mb = dict.mysteryBox;

  return (
    <>
      <Header />
      <main className="subpage-main mystery-box-page mystery-box-hub">
        <div className="subpage-container mystery-box-container">
          <Link href="/" className="back-link">
            {mb.backLink}
          </Link>
          <h1>{mb.title}</h1>
          <p className="mystery-box-page-intro">{mb.pageIntro}</p>

          <div className="mystery-box-previews" aria-label={mb.title}>
            <MysteryBoxPreview
              href="/mystery-box/medium"
              src="/assets/mystery-box/medium-box.webp"
              label={mb.previewMedium}
              alt={mb.medium.boxAlt}
              stagger="up"
              priority
            />
            <span className="mystery-box-preview-divider" aria-hidden="true" />
            <MysteryBoxPreview
              href="/mystery-box/large"
              src="/assets/mystery-box/large-box.webp"
              label={mb.previewLarge}
              alt={mb.large.boxAlt}
              stagger="down"
            />
          </div>
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
