import type { Metadata } from "next";
import "@/styles/marketplace.css";
import { MarketplaceShell } from "@/components/marketplace/MarketplaceShell";

export const metadata: Metadata = {
  title: "SOLOVYEV RESALE",
  description:
    "Israel’s marketplace for streetwear, designer & vintage. Buy. Sell. Resale.",
  robots: { index: false, follow: false },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-surface="marketplace">
      <MarketplaceShell>{children}</MarketplaceShell>
    </div>
  );
}
