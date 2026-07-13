"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { productMatchesCampaignTarget } from "@/lib/campaign/campaign-discount";
import { useCampaignBySlug } from "@/lib/hooks/useActiveCampaigns";
import { CampaignShopBanner } from "@/components/shop/CampaignShopBanner";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { applyShopFilters, productMatchesStoneFilter } from "@/lib/shop-filter-utils";
import { useShopFiltersUrl } from "@/lib/hooks/useShopFiltersUrl";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import {
  ShopProductPages,
  type ShopProductDisplayPage,
} from "@/components/shop/ShopProductPages";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { ShopFiltersPanel, ShopFiltersDrawer } from "@/components/shop/ShopFilters";
import { PreOwnedShopStrip } from "@/components/pre-owned/PreOwnedShopStrip";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCatalogProducts } from "@/lib/hooks/useCatalogProducts";
import type { Product } from "@/lib/types";
import { SliderHorizontal } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import { useApp } from "@/lib/context/AppContext";
import type { ProductOccasion, RingStyle, StoneType } from "@/lib/types";
import { useAbExperiment } from "@/lib/hooks/useAbExperiment";

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

type SeoLandingInput = {
  facet: "stone" | "style" | "occasion";
  slug: StoneType | RingStyle | ProductOccasion;
  title: string;
  intro: string;
  fallbackQueryHref: string;
};

export function ShopPageClientWithSeoLanding({ seoLanding }: { seoLanding: SeoLandingInput }) {
  return (
    <Suspense fallback={<div className="shop-page min-h-screen bg-matte" aria-hidden />}>
      <ShopPageContent seoLanding={seoLanding} />
    </Suspense>
  );
}

function ShopPageContent({ seoLanding }: { seoLanding?: SeoLandingInput }) {
  const searchParams = useSearchParams();
  const campaignSlug = searchParams.get("campaign");
  const { campaign: shopCampaign } = useCampaignBySlug(campaignSlug);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<ShopSortKey>("bestselling");
  const {
    pages: catalogPages,
    products,
    maxPrice,
    isLoading: isCatalogLoading,
    hasMore,
    isLoadingMore,
    pageSize,
    loadMore,
  } = useCatalogProducts();
  const { filters, setFilters, resetFilters } = useShopFiltersUrl(maxPrice);
  const search = useProductSearch(filters.query);
  const { auth } = useApp();
  const cardLayoutExperiment = useAbExperiment("shop_card_layout_v1");

  const isSearchMode = search.hasQuery;

  const transformPageProducts = useCallback(
    (items: Product[]) => {
      const filtered = applyShopFilters(items, filters, { skipQuery: isSearchMode });
      const landingFiltered = !seoLanding
        ? filtered
        : filtered.filter((p) => {
            if (seoLanding.facet === "stone") return productMatchesStoneFilter(p, [seoLanding.slug]);
            if (seoLanding.facet === "style") return p.category === seoLanding.slug;
            const occasions = p.occasions ?? [];
            return occasions.includes(seoLanding.slug as ProductOccasion);
          });
      const campaignFiltered = !shopCampaign
        ? landingFiltered
        : landingFiltered.filter((p) =>
            productMatchesCampaignTarget(
              { productId: p.id, collectionId: p.collectionId ?? null },
              shopCampaign
            )
          );

      const prefStone = auth.user?.favoriteStone;
      const prefStyle = auth.user?.favoriteStyle;
      const prefBudget = auth.user?.favoriteBudgetBand;
      let preferenceSorted = campaignFiltered;
      if (prefStone || prefStyle || prefBudget) {
        const budgetOf = (price: number): "entry" | "mid" | "premium" | "luxury" => {
          if (price <= 40_000_000) return "entry";
          if (price <= 90_000_000) return "mid";
          if (price <= 180_000_000) return "premium";
          return "luxury";
        };
        preferenceSorted = [...campaignFiltered].sort((a, b) => {
          const score = (p: Product) => {
            let s = 0;
            if (prefStone && p.stone === prefStone) s += 5;
            if (prefStyle && p.category === prefStyle) s += 5;
            if (prefBudget && budgetOf(p.price) === prefBudget) s += 4;
            if (p.featured) s += 2;
            if (p.bestseller) s += 1;
            return s;
          };
          return score(b) - score(a);
        });
      }

      return sortShopProducts(preferenceSorted, sort);
    },
    [
      filters,
      isSearchMode,
      seoLanding,
      shopCampaign,
      auth.user?.favoriteStone,
      auth.user?.favoriteStyle,
      auth.user?.favoriteBudgetBand,
      sort,
    ]
  );

  const filterResetKey = useMemo(
    () =>
      JSON.stringify({
        filters,
        sort,
        seoLanding,
        campaignId: shopCampaign?.id ?? null,
        prefStone: auth.user?.favoriteStone ?? null,
        prefStyle: auth.user?.favoriteStyle ?? null,
        prefBudget: auth.user?.favoriteBudgetBand ?? null,
        search: isSearchMode ? search.resolvedQuery : null,
      }),
    [
      filters,
      sort,
      seoLanding,
      shopCampaign?.id,
      auth.user?.favoriteStone,
      auth.user?.favoriteStyle,
      auth.user?.favoriteBudgetBand,
      isSearchMode,
      search.resolvedQuery,
    ]
  );

  const [displayPages, setDisplayPages] = useState<ShopProductDisplayPage[]>([]);
  const syncedCatalogPagesRef = useRef(0);

  // Rebuild all pages when filters/sort/search change.
  useEffect(() => {
    if (isSearchMode) {
      const searchProducts = transformPageProducts(search.catalogHits);
      setDisplayPages(
        searchProducts.length > 0 ? [{ id: "search-results", products: searchProducts }] : []
      );
      syncedCatalogPagesRef.current = 0;
      return;
    }

    setDisplayPages(
      catalogPages
        .map((page) => ({
          id: page.id,
          products: transformPageProducts(page.products),
        }))
        .filter((page) => page.products.length > 0)
    );
    syncedCatalogPagesRef.current = catalogPages.length;
    // catalogPages intentionally read for full rebuild on filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterResetKey, isSearchMode, search.catalogHits, transformPageProducts]);

  // Digikala-style append: only mount a new page block; keep previous pages untouched.
  useEffect(() => {
    if (isSearchMode) return;

    if (catalogPages.length < syncedCatalogPagesRef.current) {
      setDisplayPages(
        catalogPages
          .map((page) => ({
            id: page.id,
            products: transformPageProducts(page.products),
          }))
          .filter((page) => page.products.length > 0)
      );
      syncedCatalogPagesRef.current = catalogPages.length;
      return;
    }

    if (catalogPages.length === syncedCatalogPagesRef.current) return;

    const freshPages = catalogPages.slice(syncedCatalogPagesRef.current);
    const appended = freshPages
      .map((page) => ({
        id: page.id,
        products: transformPageProducts(page.products),
      }))
      .filter((page) => page.products.length > 0);

    if (appended.length > 0) {
      setDisplayPages((prev) => [...prev, ...appended]);
    }
    syncedCatalogPagesRef.current = catalogPages.length;
  }, [catalogPages, isSearchMode, transformPageProducts]);

  const displayProductsCount = useMemo(
    () => displayPages.reduce((sum, page) => sum + page.products.length, 0),
    [displayPages]
  );

  const filteredCount = useMemo(() => {
    if (isSearchMode) return transformPageProducts(search.catalogHits).length;
    return transformPageProducts(products).length;
  }, [isSearchMode, search.catalogHits, products, transformPageProducts]);

  const personalizedPicks = useMemo(() => {
    const prefStone = auth.user?.favoriteStone;
    const prefStyle = auth.user?.favoriteStyle;
    const prefBudget = auth.user?.favoriteBudgetBand;
    if (!prefStone && !prefStyle && !prefBudget) return [];
    if (isSearchMode) return [];

    const budgetOf = (price: number): "entry" | "mid" | "premium" | "luxury" => {
      if (price <= 40_000_000) return "entry";
      if (price <= 90_000_000) return "mid";
      if (price <= 180_000_000) return "premium";
      return "luxury";
    };

    const score = (p: Product) => {
      let s = 0;
      if (prefStone && p.stone === prefStone) s += 5;
      if (prefStyle && p.category === prefStyle) s += 5;
      if (prefBudget && budgetOf(p.price) === prefBudget) s += 4;
      if (p.featured) s += 2;
      if (p.bestseller) s += 1;
      return s;
    };

    return [...products]
      .map((product) => ({ product, score: score(product) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.product);
  }, [
    products,
    isSearchMode,
    auth.user?.favoriteStone,
    auth.user?.favoriteStyle,
    auth.user?.favoriteBudgetBand,
  ]);

  const cardVariant = cardLayoutExperiment.variantId === "compact_grid" ? "compact" : "grid";
  const isLoading = isCatalogLoading || (isSearchMode && search.isSearching);
  const showSearchError = isSearchMode && search.searchFailed && !search.isSearching;
  const canFetchMore = hasMore && !isSearchMode;

  const handleLoadMore = useCallback(() => {
    if (!canFetchMore || isLoadingMore) return;
    void loadMore();
  }, [canFetchMore, isLoadingMore, loadMore]);

  const loadMoreSentinelRef = useInfiniteScroll({
    enabled: !isLoading && displayProductsCount > 0 && canFetchMore && !isLoadingMore,
    recheckKey: `${catalogPages.length}|${hasMore}`,
    rootMargin: "480px 0px",
    onLoadMore: handleLoadMore,
  });

  useEffect(() => {
    if (isLoading || isSearchMode || isLoadingMore) return;
    if (displayProductsCount === 0 && hasMore) {
      void loadMore();
    }
  }, [isLoading, isSearchMode, isLoadingMore, displayProductsCount, hasMore, loadMore]);

  const emptyMessage = useMemo(() => {
    if (showSearchError) return fa.shop.searchError;
    if (isSearchMode && !isLoading && filteredCount === 0) return fa.shop.searchNoMatches;
    return fa.shop.noResults;
  }, [showSearchError, isSearchMode, isLoading, filteredCount]);

  const emptyHint = useMemo(() => {
    if (showSearchError) return fa.shop.searchApiHint;
    return fa.shop.noResultsHint;
  }, [showSearchError]);

  const priceRangeReady = !isCatalogLoading && maxPrice > 0;
  const seoLandingActive = Boolean(seoLanding);

  const hasPreferenceProfile = Boolean(
    auth.user?.favoriteStone || auth.user?.favoriteStyle || auth.user?.favoriteBudgetBand
  );

  return (
    <PageTransition>
      <motion.div className="shop-page">
        <motion.div className="site-container">
          <Breadcrumb
            items={[
              { label: fa.nav.home, href: "/" },
              { label: fa.nav.shop },
            ]}
          />
          {!isSearchMode ? <PreOwnedShopStrip /> : null}

          {isSearchMode && isLoading ? (
            <LoadingState variant="search-bar" label={fa.shop.searchLoading} />
          ) : null}

          <div className="shop-collection-layout shop-collection-layout--with-sidebar">
            <aside className="shop-filters-sidebar" aria-label={fa.shop.refine}>
              <div className="shop-filters-sticky">
                <ShopFiltersPanel
                  filters={filters}
                  onChange={setFilters}
                  maxPrice={maxPrice}
                  priceRangeReady={priceRangeReady}
                  onReset={resetFilters}
                  products={products}
                  variant="sidebar"
                />
              </div>
            </aside>

            <motion.div className="shop-collection-main">
              {shopCampaign ? (
                <div className="mb-4 space-y-2">
                  <CampaignShopBanner campaign={shopCampaign} />
                  <p className="text-sm text-silver">
                    {fa.shop.campaignFilterActive(shopCampaign.title)}
                  </p>
                </div>
              ) : null}
              <ShopFiltersDrawer
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                filters={filters}
                onChange={setFilters}
                maxPrice={maxPrice}
                priceRangeReady={priceRangeReady}
                onReset={resetFilters}
                products={products}
              />

              <div className="shop-sort-inline mb-4 md:mb-5">
                {seoLandingActive ? (
                  <section className="shop-seo-landing-intro mb-4" aria-label={seoLanding?.title}>
                    <h1>{seoLanding?.title}</h1>
                    <p>{seoLanding?.intro}</p>
                    <a href={seoLanding?.fallbackQueryHref}>{fa.shop.seoLandingViewAsFilter}</a>
                  </section>
                ) : null}
                {personalizedPicks.length > 0 ? (
                  <section className="shop-personalized-picks mb-5" aria-label={fa.shop.personalizedPicksTitle}>
                    <div className="shop-personalized-picks-head">
                      <h2>{fa.shop.personalizedPicksTitle}</h2>
                      <p>{fa.shop.personalizedPicksSubtitle}</p>
                    </div>
                    <ShopProductGrid products={personalizedPicks} />
                  </section>
                ) : null}
                {hasPreferenceProfile && !isSearchMode ? (
                  <div className="shop-preference-hint mb-3" role="status">
                    <strong>{fa.shop.personalizedPanelTitle}</strong>
                    <p>{fa.shop.personalizedPanelHint}</p>
                  </div>
                ) : null}
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
                    <span className="shop-sort-box-count-num">{fa.shop.count(displayProductsCount)}</span>
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
                ) : displayProductsCount === 0 && !isSearchMode && (isLoadingMore || hasMore) ? (
                  <div className="shop-product-grid" aria-busy="true">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <ProductCardSkeleton key={`filter-more-${idx}`} />
                    ))}
                  </div>
                ) : displayProductsCount === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="shop-empty-state"
                  >
                    <UnifiedEmptyState
                      visual="shop"
                      title={emptyMessage}
                      description={emptyHint}
                      action={
                        <button
                          type="button"
                          onClick={() => {
                            resetFilters();
                            setFiltersOpen(false);
                          }}
                          className="shop-filter-reset"
                        >
                          {fa.shop.clearFilters}
                        </button>
                      }
                    />
                  </motion.div>
                ) : (
                  <ShopProductPages
                    pages={displayPages}
                    isLoadingMore={isLoadingMore}
                    skeletonCount={Math.min(pageSize, 12)}
                    cardVariant={cardVariant}
                    abTest={{
                      experimentId: cardLayoutExperiment.experimentId,
                      variantId: cardLayoutExperiment.variantId,
                      identity: cardLayoutExperiment.identity,
                      page: "/shop",
                    }}
                    showSentinel={canFetchMore}
                    sentinelRef={loadMoreSentinelRef}
                  />
                )}
              </section>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
