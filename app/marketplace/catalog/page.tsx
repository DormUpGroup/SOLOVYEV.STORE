import { Suspense } from "react";
import MarketplaceCatalogPage from "./CatalogClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="mp-container mp-empty">…</div>}>
      <MarketplaceCatalogPage />
    </Suspense>
  );
}
