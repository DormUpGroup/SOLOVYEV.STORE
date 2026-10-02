"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { MarketplaceHeader } from "./MarketplaceHeader";
import { MarketplaceToastProvider } from "./MarketplaceToast";

function tabActive(pathname: string, href: string) {
  if (href === "/marketplace") {
    return pathname === "/marketplace";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const pathname = usePathname();
  const isLogin = pathname === "/marketplace/login";

  if (isLogin) {
    return <>{children}</>;
  }

  const tabs = [
    { href: "/marketplace", label: mp.brandSub, icon: "home" as const },
    { href: "/marketplace/catalog", label: mp.nav.shop, icon: "shop" as const },
    { href: "/marketplace/sell", label: mp.nav.sell, icon: "sell" as const },
    { href: "/marketplace/me", label: mp.nav.profile, icon: "me" as const },
  ];

  return (
    <MarketplaceToastProvider>
      <div className="mp-shell">
        <MarketplaceHeader />
        <main className="mp-main">{children}</main>
        <footer className="mp-footer">
          <div className="mp-footer-inner">
            <div>
              <p>{mp.footer.tagline}</p>
              <p className="mp-demo-note">{mp.demoNote}</p>
            </div>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              <Link href="/">{mp.backToStore}</Link>
              <Link href="/marketplace/sell">{mp.nav.sell}</Link>
              <Link href="/marketplace/catalog">{mp.nav.shop}</Link>
            </div>
          </div>
        </footer>

        <nav className="mp-tabbar" aria-label={mp.nav.menu}>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mp-tabbar-item${tabActive(pathname, tab.href) ? " active" : ""}`}
            >
              <span className="mp-tabbar-icon" aria-hidden>
                {tab.icon === "home" ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                ) : null}
                {tab.icon === "shop" ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4V6zm1 4h14l-1.2 9H6.2L5 10zm3 2v5h2v-5H8zm6 0v5h2v-5h-2z" />
                  </svg>
                ) : null}
                {tab.icon === "sell" ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                ) : null}
                {tab.icon === "me" ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14z" />
                  </svg>
                ) : null}
              </span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </MarketplaceToastProvider>
  );
}
