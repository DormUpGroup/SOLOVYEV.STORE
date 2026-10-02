"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { readFavorites } from "@/lib/marketplace/utils";

export function MarketplaceHeader() {
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setFavCount(readFavorites().length);
    const onStorage = () => setFavCount(readFavorites().length);
    window.addEventListener("storage", onStorage);
    window.addEventListener("mp-favorites", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mp-favorites", onStorage);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(
      q
        ? `/marketplace/catalog?q=${encodeURIComponent(q)}`
        : "/marketplace/catalog",
    );
  };

  return (
    <>
      <header className="mp-header">
        <div className="mp-header-inner">
          <Link href="/marketplace" className="mp-logo">
            <span className="mp-logo-mark">{mp.brand}</span>
            <span className="mp-logo-sub">{mp.brandSub}</span>
          </Link>

          <nav className="mp-nav" aria-label={mp.nav.menu}>
            <Link
              href="/marketplace/catalog"
              className={isActive("/marketplace/catalog") ? "active" : ""}
            >
              {mp.nav.shop}
            </Link>
            <Link
              href="/marketplace/sell"
              className={isActive("/marketplace/sell") ? "active" : ""}
            >
              {mp.nav.sell}
            </Link>
          </nav>

          <div className="mp-header-end">
            <form className="mp-search-desktop" onSubmit={onSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mp.catalog.searchPlaceholder}
                aria-label={mp.nav.search}
              />
            </form>

            <div className="mp-header-actions">
              <LanguageSwitcher />
              <Link
                href="/marketplace/me"
                className="mp-icon-btn mp-icon-fav"
                aria-label={mp.nav.favorites}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {favCount > 0 ? (
                  <span className="mp-badge-count">{favCount}</span>
                ) : null}
              </Link>
              <Link
                href="/marketplace/me"
                className="mp-icon-btn mp-icon-profile"
                aria-label={mp.nav.profile}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14z" />
                </svg>
              </Link>
              <button
                type="button"
                className="mp-icon-btn mp-menu-btn"
                aria-label={mp.nav.menu}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  {menuOpen ? (
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  ) : (
                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`mp-mobile-nav${menuOpen ? " open" : ""}`}>
        <Link href="/" className="mp-back-store">
          {mp.backToStore}
        </Link>
        <form onSubmit={onSearch}>
          <input
            className="mp-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mp.catalog.searchPlaceholder}
          />
        </form>
        <Link href="/marketplace/catalog">{mp.nav.shop}</Link>
        <Link href="/marketplace/sell">{mp.nav.sell}</Link>
        <Link href="/marketplace/me">{mp.nav.favorites}</Link>
      </div>
    </>
  );
}
