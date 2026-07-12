"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import {
  FixedBottomBar,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";
import {
  buildMapEmbedUrl,
  buildMapsSearchUrl,
  formatDisplayPhone,
  getStoreLocationLabel,
} from "@/lib/contacts";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function AboutPageClient() {
  const { config } = useStore();
  const { dict } = useI18n();
  const { about, hero } = dict;
  const phone = config.contacts.whatsappPhone;
  const phoneDisplay = formatDisplayPhone(phone);
  const locationLabel = getStoreLocationLabel(config);
  const mapEmbedUrl = buildMapEmbedUrl(config.location.lat, config.location.lng);
  const mapsUrl = buildMapsSearchUrl(locationLabel);

  return (
    <>
      <Header />
      <main className="subpage-main about-page">
        <div className="subpage-container about-container">
          <Link href="/" className="back-link">
            {about.backLink}
          </Link>
          <h1>{about.title}</h1>

          <div className="about-layout">
            <div className="about-copy">
              <p className="about-lead">{about.lead}</p>
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph} className="about-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="about-photo-col">
              <div className="about-photo-wrap">
                <div className="about-photo-float">
                  <div className="about-photo-inner">
                    <Image
                      src={config.images.heroPhoto}
                      alt={about.photoAlt}
                      fill
                      sizes="(max-width: 768px) 90vw, 420px"
                      className="about-photo-img"
                      priority
                    />
                  </div>
                  <div className="tech-tag tag-1">
                    <span className="tag-glow" aria-hidden="true" />{" "}
                    {hero.badgeAuthentic}
                  </div>
                  <div className="tech-tag tag-2">
                    <span className="tag-glow" aria-hidden="true" />{" "}
                    {hero.badgeIsrael}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="about-meta">
            <section className="about-contacts" aria-labelledby="about-contacts-title">
              <h2 id="about-contacts-title" className="about-meta-title">
                {about.contactsTitle}
              </h2>
              <div className="about-contact-links">
                <a
                  href={config.contacts.instagramUrl}
                  className="about-contact-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>{about.instagramHandle}</span>
                </a>
                <a
                  href={buildWhatsAppUrl(`Hi ${config.contacts.managerName}!`, config)}
                  className="about-contact-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>{phoneDisplay}</span>
                </a>
              </div>
            </section>

            <section className="about-map" aria-labelledby="about-location-title">
              <h2 id="about-location-title" className="about-meta-title">
                {about.locationTitle} · {config.location.city.toUpperCase()}
              </h2>
              <div className="about-map-frame">
                <iframe
                  title={`${locationLabel} map`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={mapsUrl}
                className="about-map-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {locationLabel} — {about.openInMaps}
              </a>
            </section>
          </div>
        </div>
      </main>
      <MinimalFooter />
      <FixedBottomBar />
      <ToastNotification />
      <SellTradeModal />
      <FaqModal />
      <QuickViewModal />
      <CartDrawer />
    </>
  );
}
