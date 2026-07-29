"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";
import {
  buildMapsSearchUrl,
  formatDisplayPhone,
  getStoreLocationLabel,
} from "@/lib/contacts";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { StoreLogoMark } from "@/components/layout/StoreLogo";

export function MinimalFooter() {
  const { config } = useStore();
  const { dict } = useI18n();
  const { footer, header, categories } = dict;
  const phoneDisplay = formatDisplayPhone(config.contacts.whatsappPhone);
  const locationLabel = getStoreLocationLabel(config);
  const year = new Date().getFullYear();

  const shopLinks = [
    { href: "/drops", label: header.allDrops },
    { href: "/made-to-order", label: header.madeToOrder },
    { href: "/brand-new", label: header.brandNew },
    { href: "/drops?category=sneakers", label: categories.sneakers },
    { href: "/drops?category=clothing", label: categories.clothing },
    { href: "/drops?category=accessories", label: categories.accessories },
    { href: "/brands", label: header.brands },
  ];

  const infoLinks = [
    { href: "/about", label: header.aboutUs },
    { href: "/faq", label: footer.faq },
    { href: "/sell-trade", label: header.sellTrade },
    { href: "/privacy", label: footer.privacy },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link href="/" className="footer-logo">
              <StoreLogoMark size={28} className="footer-logo-mark" />
              <span className="footer-logo-text">
                SOLOVYEV<span>.STORE</span>
              </span>
            </Link>
            <p className="footer-tagline">{footer.tagline}</p>
            <p className="footer-location">{locationLabel}</p>
          </div>

          <nav className="footer-nav-col" aria-label={footer.shopTitle}>
            <h3 className="footer-col-title">{footer.shopTitle}</h3>
            <ul className="footer-links">
              {shopLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-nav-col" aria-label={footer.infoTitle}>
            <h3 className="footer-col-title">{footer.infoTitle}</h3>
            <ul className="footer-links">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-contact-col">
            <h3 className="footer-col-title">{footer.contactTitle}</h3>
            <ul className="footer-links footer-contact-links">
              <li>
                <a
                  href={config.contacts.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link"
                >
                  <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  @solovyev.store
                </a>
              </li>
              <li>
                <a
                  href={buildWhatsAppUrl(`Hi ${config.contacts.managerName}!`, config)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link"
                >
                  <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  {phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={buildMapsSearchUrl(locationLabel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link"
                >
                  <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {locationLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>

          <div className="footer-bottom">
          <p className="footer-copyright">
            © {year} {config.storeName}. {footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function FixedBottomBar() {
  const { config } = useStore();
  const { cartCount, openCart, isHydrated } = useCart();
  const displayCount = isHydrated ? cartCount : 0;
  const { openSellTrade, openFaq } = useUI();
  const { dict } = useI18n();
  const { footer, header } = dict;

  return (
    <div className="fixed-bottom-bar">
      <div className="bar-container">
        <div className="bar-brand">
          <span className="bar-title">
            SOLOVYEV<span>.STORE</span>
          </span>
        </div>
        <div className="bar-actions">
          <button type="button" className="bar-pill-btn" id="bar-sell-btn" onClick={openSellTrade}>
            {header.sellTrade}
          </button>
          <button type="button" className="bar-pill-btn" id="bar-cart-btn" onClick={openCart}>
            {footer.cart} ({displayCount})
          </button>
          <button type="button" className="bar-pill-btn" id="bar-faq-btn" onClick={openFaq}>
            {footer.faq}
          </button>
          <a
            href={config.contacts.instagramUrl}
            className="bar-circle-btn bar-instagram js-instagram-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={header.instagram}
          >
            <svg className="icon-svg" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export function ConsentBanner() {
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);
  const { dict } = useI18n();
  const { consent } = dict;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const accepted = localStorage.getItem("storage_consent_accepted");
    if (!accepted) setVisible(true);
  }, [hydrated]);

  if (!hydrated || !visible) return null;

  return (
    <div className="consent-banner show" id="storage-consent-banner">
      <div className="consent-content">
        <p>
          {consent.text}{" "}
          <Link href="/privacy">{consent.privacy}</Link>.
        </p>
        <button
          type="button"
          className="consent-btn"
          id="accept-storage-consent"
          onClick={() => {
            localStorage.setItem("storage_consent_accepted", "true");
            setVisible(false);
          }}
        >
          {consent.accept}
        </button>
      </div>
    </div>
  );
}

export function ToastNotification() {
  const { toast, clearToast } = useCart();
  if (!toast) return null;

  return (
    <div
      className={`toast-notification ${toast.type}`}
      role="status"
      onClick={clearToast}
    >
      {toast.message}
    </div>
  );
}
