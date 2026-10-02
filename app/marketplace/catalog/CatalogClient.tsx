"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { ListingCard } from "@/components/marketplace/ListingCard";
import {
  MARKETPLACE_BRANDS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CITIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_SHOE_SIZES,
  MARKETPLACE_SIZES,
  type MarketplaceCategory,
  type MarketplaceCondition,
  type MarketplaceFilters,
  type MarketplaceSort,
} from "@/lib/marketplace/types";
import { filterListings, getDefaultFilters } from "@/lib/marketplace/utils";

type DropdownKey =
  | "brand"
  | "category"
  | "size"
  | "condition"
  | "price"
  | "seller"
  | "auth";

function FilterDropdown({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`mp-dd${open ? " open" : ""}`}>
      <button
        type="button"
        className="mp-dd-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="mp-dd-label">
          {label}
          {count && count > 0 ? (
            <span className="mp-dd-count">{count}</span>
          ) : null}
        </span>
        <span className="mp-dd-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="mp-dd-panel">{children}</div> : null}
    </div>
  );
}

export default function MarketplaceCatalogPage() {
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openDd, setOpenDd] = useState<DropdownKey | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>(() =>
    getDefaultFilters(),
  );

  useEffect(() => {
    const next = getDefaultFilters();
    const q = searchParams.get("q");
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") as MarketplaceSort | null;
    if (q) next.query = q;
    if (brand) next.brands = [brand];
    if (
      category &&
      MARKETPLACE_CATEGORIES.includes(category as MarketplaceCategory)
    ) {
      next.categories = [category as MarketplaceCategory];
    }
    if (
      sort &&
      ["newest", "price_asc", "price_desc", "popular", "updated"].includes(sort)
    ) {
      next.sort = sort;
    }
    setFilters(next);
    if (brand) setOpenDd("brand");
    else if (category) setOpenDd("category");
  }, [searchParams]);

  const results = useMemo(() => filterListings(filters), [filters]);

  const toggleDd = (key: DropdownKey) => {
    setOpenDd((cur) => (cur === key ? null : key));
  };

  const toggleBrand = (brand: string) => {
    setFilters((f) => ({
      ...f,
      brands: f.brands.includes(brand)
        ? f.brands.filter((b) => b !== brand)
        : [...f.brands, brand],
    }));
  };

  const toggleCategory = (cat: MarketplaceCategory) => {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const toggleSize = (size: string) => {
    setFilters((f) => ({
      ...f,
      sizes: f.sizes.includes(size)
        ? f.sizes.filter((s) => s !== size)
        : [...f.sizes, size],
    }));
  };

  const toggleCondition = (c: MarketplaceCondition) => {
    setFilters((f) => ({
      ...f,
      conditions: f.conditions.includes(c)
        ? f.conditions.filter((x) => x !== c)
        : [...f.conditions, c],
    }));
  };

  const allSizes = [
    ...MARKETPLACE_SIZES,
    ...MARKETPLACE_SHOE_SIZES,
    "One Size",
    "30",
    "32",
  ];

  const priceCount =
    (filters.minPrice != null ? 1 : 0) + (filters.maxPrice != null ? 1 : 0);

  return (
    <div className="mp-container">
      <div className="mp-catalog-layout">
        <aside className="mp-filters">
          <button
            type="button"
            className="mp-filters-toggle"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {mp.catalog.filters}
            <span>{filtersOpen ? "−" : "+"}</span>
          </button>
          <div className={`mp-filters-body${filtersOpen ? " open" : ""}`}>
            <div className="mp-filter-group">
              <label htmlFor="mp-q">{mp.nav.search}</label>
              <input
                id="mp-q"
                className="mp-input"
                value={filters.query}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, query: e.target.value }))
                }
                placeholder={mp.catalog.searchPlaceholder}
              />
            </div>

            <FilterDropdown
              label={mp.catalog.brand}
              count={filters.brands.length}
              open={openDd === "brand"}
              onToggle={() => toggleDd("brand")}
            >
              <div className="mp-dd-options">
                {MARKETPLACE_BRANDS.map((brand) => (
                  <label key={brand} className="mp-check">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={mp.catalog.category}
              count={filters.categories.length}
              open={openDd === "category"}
              onToggle={() => toggleDd("category")}
            >
              <div className="mp-dd-options">
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <label key={cat} className="mp-check">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{mp.categories[cat] ?? cat}</span>
                  </label>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={mp.catalog.size}
              count={filters.sizes.length}
              open={openDd === "size"}
              onToggle={() => toggleDd("size")}
            >
              <div className="mp-dd-chips">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`mp-dd-chip${filters.sizes.includes(size) ? " active" : ""}`}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={mp.catalog.condition}
              count={filters.conditions.length}
              open={openDd === "condition"}
              onToggle={() => toggleDd("condition")}
            >
              <div className="mp-dd-options">
                {MARKETPLACE_CONDITIONS.map((c) => (
                  <label key={c} className="mp-check">
                    <input
                      type="checkbox"
                      checked={filters.conditions.includes(c)}
                      onChange={() => toggleCondition(c)}
                    />
                    <span>{mp.conditions[c]}</span>
                  </label>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={mp.catalog.price}
              count={priceCount}
              open={openDd === "price"}
              onToggle={() => toggleDd("price")}
            >
              <div className="mp-price-row">
                <input
                  className="mp-input"
                  type="number"
                  inputMode="numeric"
                  placeholder={mp.catalog.min}
                  value={filters.minPrice ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      minPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
                <input
                  className="mp-input"
                  type="number"
                  inputMode="numeric"
                  placeholder={mp.catalog.max}
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      maxPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </FilterDropdown>

            <div className="mp-filter-group">
              <label htmlFor="mp-city">{mp.catalog.location}</label>
              <select
                id="mp-city"
                className="mp-select"
                value={filters.city}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, city: e.target.value }))
                }
              >
                <option value="">{mp.catalog.allCities}</option>
                {MARKETPLACE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <FilterDropdown
              label={mp.catalog.seller}
              count={filters.verifiedOnly ? 1 : 0}
              open={openDd === "seller"}
              onToggle={() => toggleDd("seller")}
            >
              <div className="mp-dd-options">
                <label className="mp-check">
                  <input
                    type="radio"
                    name="seller"
                    checked={!filters.verifiedOnly}
                    onChange={() =>
                      setFilters((f) => ({ ...f, verifiedOnly: false }))
                    }
                  />
                  <span>{mp.catalog.allSellers}</span>
                </label>
                <label className="mp-check">
                  <input
                    type="radio"
                    name="seller"
                    checked={filters.verifiedOnly}
                    onChange={() =>
                      setFilters((f) => ({ ...f, verifiedOnly: true }))
                    }
                  />
                  <span>{mp.catalog.verifiedSellers}</span>
                </label>
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={mp.catalog.authentication}
              count={filters.authenticatedOnly ? 1 : 0}
              open={openDd === "auth"}
              onToggle={() => toggleDd("auth")}
            >
              <div className="mp-dd-options">
                <label className="mp-check">
                  <input
                    type="radio"
                    name="auth"
                    checked={!filters.authenticatedOnly}
                    onChange={() =>
                      setFilters((f) => ({ ...f, authenticatedOnly: false }))
                    }
                  />
                  <span>{mp.catalog.allAuth}</span>
                </label>
                <label className="mp-check">
                  <input
                    type="radio"
                    name="auth"
                    checked={filters.authenticatedOnly}
                    onChange={() =>
                      setFilters((f) => ({ ...f, authenticatedOnly: true }))
                    }
                  />
                  <span>{mp.catalog.authenticatedOnly}</span>
                </label>
              </div>
            </FilterDropdown>

            <button
              type="button"
              className="mp-btn mp-btn-ghost"
              onClick={() => {
                setFilters(getDefaultFilters());
                setOpenDd(null);
              }}
            >
              {mp.catalog.clear}
            </button>
          </div>
        </aside>

        <div>
          <div className="mp-catalog-toolbar">
            <p className="mp-results-count">
              {mp.catalog.results.replace("{count}", String(results.length))}
            </p>
            <select
              className="mp-select"
              style={{ width: "auto", minWidth: 180 }}
              value={filters.sort}
              aria-label={mp.catalog.sort}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  sort: e.target.value as MarketplaceSort,
                }))
              }
            >
              <option value="newest">{mp.catalog.sortNewest}</option>
              <option value="price_asc">{mp.catalog.sortPriceAsc}</option>
              <option value="price_desc">{mp.catalog.sortPriceDesc}</option>
              <option value="popular">{mp.catalog.sortPopular}</option>
              <option value="updated">{mp.catalog.sortUpdated}</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="mp-empty">{mp.catalog.noResults}</div>
          ) : (
            <div className="mp-grid">
              {results.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
