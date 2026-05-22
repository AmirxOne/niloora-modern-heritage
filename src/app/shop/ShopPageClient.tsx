"use client";

import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { applyShopFilters } from "@/lib/shop-filter-utils";
import { useShopFiltersUrl } from "@/lib/hooks/useShopFiltersUrl";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { usePagination } from "@/lib/hooks/usePagination";
import { SHOP_PAGE_SIZE } from "@/lib/pagination";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { ShopFiltersPanel, ShopFiltersDrawer } from "@/components/shop/ShopFilters";
import { PreOwnedShopStrip } from "@/components/pre-owned/PreOwnedShopStrip";
import { Pagination } from "@/components/ui/Pagination";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCatalogProducts } from "@/lib/hooks/useCatalogProducts";
import type { Product } from "@/lib/types";
import { SliderHorizontal } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

type ShopSortKey =
  | "bestselling"
  | "relevant"
  | "mostViewed"
  | "newest"
  | "priceLowToHigh"
  | "priceHighToLow";

const SHOP_SORT_OPTIONS: { value: ShopSortKey; label: string }[] = [
  { value: "bestselling", label: fa.shop.sortOptions.bestselling },
  { value: "relevant", label: fa.shop.sortOptions.relevant },
  { value: "mostViewed", label: fa.shop.sortOptions.mostViewed },
  { value: "newest", label: fa.shop.sortOptions.newest },
  { value: "priceLowToHigh", label: fa.shop.sortOptions.priceLowToHigh },
  { value: "priceHighToLow", label: fa.shop.sortOptions.priceHighToLow },
];

function compareByIdDesc(a: Product, b: Product) {
  return b.id.localeCompare(a.id, "fa");
}

function sortShopProducts(items: Product[], sort: ShopSortKey): Product[] {
  const list = [...items];
  switch (sort) {
    case "priceLowToHigh":
      return list.sort((a, b) => a.price - b.price || compareByIdDesc(a, b));
    case "priceHighToLow":
      return list.sort((a, b) => b.price - a.price || compareByIdDesc(a, b));
    case "bestselling":
      return list.sort(
        (a, b) =>
          (b.initialSalesCount ?? 0) - (a.initialSalesCount ?? 0) ||
          Number(b.bestseller) - Number(a.bestseller) ||
          compareByIdDesc(a, b)
      );
    case "mostViewed":
      return list.sort(
        (a, b) =>
          (b.initialSalesCount ?? 0) - (a.initialSalesCount ?? 0) ||
          Number(b.featured) - Number(a.featured) ||
          compareByIdDesc(a, b)
      );
    case "newest":
      return list.sort(compareByIdDesc);
    case "relevant":
    default:
      return list.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(b.bestseller) - Number(a.bestseller) ||
          (b.initialSalesCount ?? 0) - (a.initialSalesCount ?? 0) ||
          compareByIdDesc(a, b)
      );
  }
}

export function ShopPageClient() {
  return (
    <Suspense fallback={<div className="shop-page min-h-screen bg-matte" aria-hidden />}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<ShopSortKey>("bestselling");
  const { products, maxPrice, isLoading: isCatalogLoading } = useCatalogProducts();
  const { filters, setFilters, page, setPage, resetFilters } = useShopFiltersUrl(maxPrice);
  const search = useProductSearch(filters.query);

  const isSearchMode = search.hasQuery;
  const sourceProducts = useMemo(
    () => (isSearchMode ? search.catalogHits : products),
    [isSearchMode, search.catalogHits, products]
  );

  const filtered = useMemo(
    () =>
      applyShopFilters(sourceProducts, filters, {
        skipQuery: isSearchMode,
      }),
    [sourceProducts, filters, isSearchMode]
  );
  const sorted = useMemo(() => sortShopProducts(filtered, sort), [filtered, sort]);
  const cardUiQaMode = true;
  const qaProducts = useMemo(() => {
    if (!cardUiQaMode) return sorted;
    return sorted.map((product, idx) => {
      const group = idx % 4;
      const withDiscount = group === 0 || group === 1;
      const discountPercent = withDiscount
        ? product.discountPercent && product.discountPercent > 0
          ? product.discountPercent
          : 20
        : 0;
      const listPrice = product.listPrice ?? product.price;
      const discountAmount = Math.round(listPrice * (discountPercent / 100));
      const salePrice = withDiscount ? Math.max(1, listPrice - discountAmount) : listPrice;
      return {
        ...product,
        discountPercent,
        listPrice,
        price: salePrice,
      };
    });
  }, [cardUiQaMode, sorted]);
  const displayProducts = cardUiQaMode ? qaProducts : sorted;
  const timerOverridesByProductId = useMemo(() => {
    if (!cardUiQaMode) return undefined;
    return Object.fromEntries(
      qaProducts.map((product, idx) => {
        const group = idx % 4;
        const hasTimer = group === 0 || group === 2;
        return [product.id, hasTimer];
      })
    ) as Record<string, boolean>;
  }, [cardUiQaMode, qaProducts]);

  const isLoading = isCatalogLoading || (isSearchMode && search.isSearching);
  const showSearchError = isSearchMode && search.searchFailed && !search.isSearching;

  const filterResetKey = useMemo(
    () => `${JSON.stringify(filters)}|${isSearchMode ? search.resolvedQuery : "catalog"}`,
    [filters, isSearchMode, search.resolvedQuery]
  );

  const {
    paginatedItems: pagedProducts,
    totalPages,
    from,
    to,
    totalItems,
    showPagination,
    setPage: setPaginationPage,
  } = usePagination(displayProducts, SHOP_PAGE_SIZE, `${filterResetKey}|${sort}|${cardUiQaMode}`, {
    page,
    onPageChange: setPage,
  });

  const emptyMessage = useMemo(() => {
    if (showSearchError) return fa.shop.searchError;
    if (isSearchMode && !isLoading && filtered.length === 0) return fa.shop.searchNoMatches;
    return fa.shop.noResults;
  }, [showSearchError, isSearchMode, isLoading, filtered.length]);

  const emptyHint = useMemo(() => {
    if (showSearchError) return fa.shop.searchApiHint;
    if (isSearchMode && !isLoading && filtered.length === 0) {
      return fa.shop.noResultsHint;
    }
    return fa.shop.noResultsHint;
  }, [showSearchError, isSearchMode, isLoading, filtered.length]);

  return (
    <PageTransition>
      <motion.div className="shop-page">
        <motion.div className="site-container">
          {!isSearchMode ? <PreOwnedShopStrip /> : null}

          {isSearchMode && isLoading ? (
            <p className="mb-4 text-sm text-silver" aria-live="polite">
              {fa.shop.searchLoading}
            </p>
          ) : null}

          <div className="shop-collection-layout shop-collection-layout--with-sidebar">
            <aside className="shop-filters-sidebar" aria-label={fa.shop.refine}>
              <div className="shop-filters-sticky">
                <ShopFiltersPanel
                  filters={filters}
                  onChange={setFilters}
                  maxPrice={maxPrice}
                  onReset={resetFilters}
                  variant="sidebar"
                />
              </div>
            </aside>

            <motion.div className="shop-collection-main">
              <ShopFiltersDrawer
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                filters={filters}
                onChange={setFilters}
                maxPrice={maxPrice}
                onReset={resetFilters}
              />

              <div className="shop-sort-inline mb-4 md:mb-5">
                <div className="shop-sort-box" role="group" aria-label={fa.shop.sortLabel}>
                  <span className="shop-sort-box-label">
                    <SliderHorizontal
                      className="h-4 w-4 shrink-0"
                      size={iconSizes.sm}
                      variant={ICON_VARIANT}
                      aria-hidden
                    />
                    {fa.shop.sortLabel}
                  </span>
                  <div className="shop-sort-box-options">
                    {SHOP_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSort(option.value)}
                        className={cn(
                          "shop-sort-box-option",
                          sort === option.value && "shop-sort-box-option--active"
                        )}
                        aria-pressed={sort === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="shop-sort-box-count">
                    <span className="shop-sort-box-count-num">{fa.shop.count(displayProducts.length)}</span>
                    <span className="shop-sort-box-count-label">{fa.shop.countLabel}</span>
                  </p>
                </div>
              </div>

              <section
                id="shop-products"
                className="shop-product-section"
                aria-label={isSearchMode ? fa.shop.searchPageTitle : fa.shop.title}
              >
                {isLoading ? (
                  <div className="shop-product-grid" aria-busy="true">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} />
                    ))}
                  </div>
                ) : displayProducts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="shop-empty-state"
                  >
                    <p className="font-display text-xl text-ivory">{emptyMessage}</p>
                    <p className="mt-2 text-silver">{emptyHint}</p>
                    <button
                      type="button"
                      onClick={() => {
                        resetFilters();
                        setFiltersOpen(false);
                      }}
                      className="shop-filter-reset mt-6"
                    >
                      {fa.shop.clearFilters}
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {showPagination ? (
                      <p className="shop-product-range">
                        {fa.shop.pageResults(from, to, totalItems)}
                      </p>
                    ) : null}
                    <ShopProductGrid
                      products={pagedProducts}
                      timerOverridesByProductId={timerOverridesByProductId}
                    />
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPaginationPage}
                      totalItems={totalItems}
                      from={from}
                      to={to}
                      scrollTargetId="shop-products"
                      className="shop-product-pagination"
                    />
                  </>
                )}
              </section>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
