"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { MarketplaceHeader } from "./MarketplaceHeader";
import { MarketplaceToastProvider } from "./MarketplaceToast";

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const pathname = usePathname();
  const isLogin = pathname === "/marketplace/login";

  if (isLogin) {
    return <>{children}</>;
  }

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
      </div>
    </MarketplaceToastProvider>
  );
}
