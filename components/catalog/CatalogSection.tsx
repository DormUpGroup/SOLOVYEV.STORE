"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  filterProducts,
  getAvailableSizes,
  getNewestArrivals,
} from "@/lib/products";
import { useStore } from "@/components/providers/StoreProvider";
import { trackFilterApply } from "@/lib/analytics";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProductCard } from "./ProductCard";
import type { ActiveFilters, Product, ProductCategory } from "@/lib/types";

const categoryKeys: Record<ProductCategory, "sneakers" | "clothing" | "accessories"> = {
  sneakers: "sneakers",
  clothing: "clothing",
  accessories: "accessories",
};

interface CatalogSectionProps {
  activeCategory: "all" | ProductCategory;
  onCategoryChange: (category: "all" | ProductCategory) => void;
  initialBrand?: string;
  brandPageTitle?: string;
  productsOverride?: Product[];
  sectionTitle?: string;
}

export function NewestArrivals() {
  const { products } = useStore();
  const items = getNewestArrivals(products, 5);
  const carouselItems = [...items, ...items];
  const { dict } = useI18n();
  const { catalog } = dict;

  return (
    <section className="horizontal-section newest-arrivals-section">
      <div className="horizontal-header">
        <h2>{catalog.newestArrivals}</h2>
        <Link href="/drops" className="shop-latest">
          {catalog.shopLatest}
        </Link>
      </div>
      <div className="horizontal-scroll-container newest-arrivals-scroll newest-arrivals-scroll--mobile">
        <div className="horizontal-track">
          {items.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      </div>
      <div className="horizontal-scroll-container newest-arrivals-scroll--desktop">
        <div className="horizontal-track newest-arrivals-track">
          {carouselItems.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CatalogSection({
  activeCategory,
  onCategoryChange,
  initialBrand = "",
  brandPageTitle,
  productsOverride,
  sectionTitle,
}: CatalogSectionProps) {
  const { products: storeProducts, config } = useStore();
  const products = productsOverride ?? storeProducts;
  const { dict } = useI18n();
  const { catalog, categories } = dict;
  const [filters, setFilters] = useState<ActiveFilters>({
    category: activeCategory,
    brand: initialBrand,
    search: "",
    size: "",
    sort: "",
  });

  const mergedFilters = useMemo(
    () => ({ ...filters, category: activeCategory, brand: initialBrand || filters.brand }),
    [filters, activeCategory, initialBrand],
  );

  const filtered = useMemo(
    () => filterProducts(products, mergedFilters),
    [mergedFilters, products],
  );

  const availableSizes = useMemo(
    () => getAvailableSizes(products, config),
    [products, config],
  );

  const setCategory = (cat: "all" | ProductCategory) => {
    onCategoryChange(cat);
    trackFilterApply("category", cat);
  };

  return (
    <section className="catalog-section" id="catalog">
      <div className="catalog-header">
        <h2 className="section-title">
          {brandPageTitle ? `${brandPageTitle.toUpperCase()}.` : sectionTitle ?? catalog.theDrops}
        </h2>
      </div>

      <div className="catalog-controls">
        <div className="filter-container">
          <button
            type="button"
            className={`filter-btn ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            {catalog.all}
          </button>
          {config.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {categories[categoryKeys[cat.id]]}
            </button>
          ))}
        </div>

        <div className="catalog-brands-bar">
          {initialBrand ? (
            <>
              <Link href="/brands" className="catalog-brands-link">
                ← {catalog.allBrands}
              </Link>
              <span className="catalog-brands-current">{initialBrand}</span>
            </>
          ) : (
            <Link href="/brands" className="catalog-brands-link">
              {catalog.shopByBrand}
            </Link>
          )}
        </div>

        <div className="search-box">
          <input
            type="search"
            id="catalog-search"
            placeholder={catalog.searchPlaceholder}
            value={filters.search}
            onChange={(e) => {
              setFilters((f) => ({ ...f, search: e.target.value }));
              trackFilterApply("search", e.target.value);
            }}
          />
        </div>

        <div className="controls-right">
          <div className="filter-select-wrapper">
            <select
              id="filter-size"
              value={filters.size}
              onChange={(e) => {
                setFilters((f) => ({ ...f, size: e.target.value }));
                trackFilterApply("size", e.target.value);
              }}
            >
              <option value="">{catalog.allSizes}</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrapper">
            <select
              id="sort-price"
              value={filters.sort}
              onChange={(e) => {
                const sort = e.target.value as ActiveFilters["sort"];
                setFilters((f) => ({ ...f, sort }));
                trackFilterApply("sort", sort);
              }}
            >
              <option value="">{catalog.sortByPrice}</option>
              <option value="low-to-high">{catalog.sortLowToHigh}</option>
              <option value="high-to-low">{catalog.sortHighToLow}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="product-grid" id="product-grid">
        {filtered.length === 0 ? (
          <p className="no-results">{catalog.noResults}</p>
        ) : (
          filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 8} />
          ))
        )}
      </div>
    </section>
  );
}
