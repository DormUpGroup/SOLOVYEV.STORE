"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/components/providers/StoreProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AnnouncementBar } from "@/components/layout/Marquees";
import { StoreLogoMark } from "@/components/layout/StoreLogo";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";
import type { ProductCategory } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

const categoryKeys: Record<ProductCategory, "sneakers" | "clothing" | "accessories"> = {
  sneakers: "sneakers",
  clothing: "clothing",
  accessories: "accessories",
};

function isProductCategory(value: string | null): value is ProductCategory {
  return value === "sneakers" || value === "clothing" || value === "accessories";
}

function Header() {
  const { config } = useStore();
  const { cartCount, openCart, isHydrated } = useCart();
  const displayCount = isHydrated ? cartCount : 0;
  const { openSellTrade } = useUI();
  const { dict } = useI18n();
  const { user } = useAuth();
  const { header, categories } = dict;
  const pathname = usePathname();
  const [categoryParam, setCategoryParam] = useState<string | null>(null);
  const onDropsPage = pathname === "/drops";
  const activeCategory: "all" | ProductCategory =
    onDropsPage && isProductCategory(categoryParam) ? categoryParam : "all";

  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [shellHeight, setShellHeight] = useState(0);
  const menuOpenRef = useRef(menuOpen);
  const shellRef = useRef<HTMLDivElement>(null);
  menuOpenRef.current = menuOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCategoryParam(new URLSearchParams(window.location.search).get("category"));
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      lockBodyScroll();
      return () => unlockBodyScroll();
    }
    return undefined;
  }, [menuOpen]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const updateHeight = () => {
      setShellHeight(shell.offsetHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [compact, hidden]);

  useEffect(() => {
    let lastScroll = window.scrollY;
    let ticking = false;
    const TOP_THRESHOLD = 72;
    const SCROLL_DELTA = 4;

    const updateHeader = () => {
      const scrollTop = Math.max(0, window.scrollY);

      if (menuOpenRef.current) {
        setHidden(false);
        lastScroll = scrollTop;
        ticking = false;
        return;
      }

      const delta = scrollTop - lastScroll;

      if (scrollTop <= TOP_THRESHOLD) {
        setHidden(false);
        setCompact(false);
      } else if (delta > SCROLL_DELTA) {
        setHidden(true);
        setCompact(true);
      } else if (delta < -SCROLL_DELTA) {
        setHidden(false);
        setCompact(true);
      }

      lastScroll = scrollTop;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const dropsNavActive = onDropsPage;

  const dropsCategoryClass = (category: ProductCategory) =>
    `nav-dropdown-link${onDropsPage && activeCategory === category ? " active" : ""}`;

  const mobileDropsCategoryClass = (category: ProductCategory) =>
    `mobile-nav-sublink${onDropsPage && activeCategory === category ? " active" : ""}`;

  const sectionLinkClass = (href: string) =>
    `nav-link${pathname === href || pathname.startsWith(`${href}?`) ? " active" : ""}`;

  const shellClassName = [
    "site-header-shell",
    hidden ? "header-hidden" : "",
    compact ? "header-compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mobileNavOverlay = (
    <div className={`mobile-nav-overlay ${menuOpen ? "open" : ""}`}>
      <div
        className="mobile-nav-container"
        style={shellHeight ? { paddingTop: shellHeight + 24 } : undefined}
      >
        <nav className="mobile-nav" aria-label={dict.common.mobileNav}>
          <div className="mobile-nav-group">
            <Link
              href="/drops"
              className={`mobile-nav-link${dropsNavActive && activeCategory === "all" ? " active" : ""}`}
              onClick={closeMenu}
            >
              {header.allDrops}
            </Link>
            <div className="mobile-nav-sub">
              {config.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/drops?category=${cat.id}`}
                  className={mobileDropsCategoryClass(cat.id)}
                  onClick={closeMenu}
                >
                  {categories[categoryKeys[cat.id]]}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/brand-new" className="mobile-nav-link" onClick={closeMenu}>
            {header.brandNew}
          </Link>
          <Link href="/made-to-order" className="mobile-nav-link" onClick={closeMenu}>
            {header.madeToOrder}
          </Link>
          <Link href="/brands" className="mobile-nav-link" onClick={closeMenu}>
            {header.brands}
          </Link>
          <Link href="/about" className="mobile-nav-link" onClick={closeMenu}>
            {header.aboutUs}
          </Link>
          <Link href={user ? "/account" : "/login"} className="mobile-nav-link" onClick={closeMenu}>
            {header.account}
          </Link>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => {
              closeMenu();
              openSellTrade();
            }}
          >
            {header.sellTrade}
          </button>
        </nav>
        <a
          href={config.contacts.instagramUrl}
          className="instagram-btn-large js-instagram-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          @solovyev.store
        </a>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="site-header-wrap"
        style={shellHeight ? { height: shellHeight } : undefined}
      >
        <div ref={shellRef} className={shellClassName}>
          <AnnouncementBar />
          <header>
            <div className="header-container">
              <Link href="/" className="logo-area">
                <StoreLogoMark />
                <div className="logo-text">
                  SOLOVYEV<span>.STORE</span>
                </div>
              </Link>

              <nav className="desktop-nav" aria-label={dict.common.mainNav}>
                <div className="nav-dropdown">
                  <Link
                    href="/drops"
                    className={`nav-link nav-dropdown-trigger${dropsNavActive ? " active" : ""}`}
                    aria-haspopup="menu"
                  >
                    <span>{header.allDrops}</span>
                    <svg
                      className="nav-dropdown-chevron"
                      viewBox="0 0 12 12"
                      width="10"
                      height="10"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 4.5L6 8l3.5-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <div className="nav-dropdown-panel" role="menu">
                    {config.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/drops?category=${cat.id}`}
                        className={dropsCategoryClass(cat.id)}
                        role="menuitem"
                      >
                        {categories[categoryKeys[cat.id]]}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link href="/brand-new" className={sectionLinkClass("/brand-new")}>
                  {header.brandNew}
                </Link>
                <Link href="/made-to-order" className={sectionLinkClass("/made-to-order")}>
                  {header.madeToOrder}
                </Link>
                <Link
                  href="/brands"
                  className={`nav-link${pathname === "/brands" || pathname.startsWith("/brand/") ? " active" : ""}`}
                >
                  {header.brands}
                </Link>
                <Link
                  href="/about"
                  className={`nav-link${pathname === "/about" ? " active" : ""}`}
                >
                  {header.aboutUs}
                </Link>
              </nav>

              <div className="header-actions">
                <LanguageSwitcher />
                <Link
                  href={user ? "/account" : "/login"}
                  className={`account-icon-btn${user ? " account-icon-btn--signed-in" : ""}`}
                  aria-label={header.account}
                  title={header.account}
                >
                  <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14z" />
                  </svg>
                </Link>
                <a
                  href={config.contacts.instagramUrl}
                  className="instagram-btn js-instagram-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={header.instagram}
                >
                  <svg className="icon-svg" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <button
                  type="button"
                  className="cta-pill-btn"
                  onClick={openSellTrade}
                >
                  {header.sellTrade}
                </button>
                <button
                  type="button"
                  className="cart-icon-btn"
                  id="header-cart-btn"
                  onClick={openCart}
                  aria-label={header.openCart}
                >
                  <svg className="icon-svg" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                  <span className="cart-count-badge" id="cart-count">
                    {displayCount}
                  </span>
                </button>
                <button
                  type="button"
                  className={`hamburger-btn ${menuOpen ? "open" : ""}`}
                  onClick={toggleMenu}
                  aria-label={header.toggleMenu}
                  aria-expanded={menuOpen}
                >
                  <span />
                  <span />
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>

      {mounted ? createPortal(mobileNavOverlay, document.body) : null}
    </>
  );
}

export { Header };
