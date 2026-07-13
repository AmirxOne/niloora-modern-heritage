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

const SHOP_SCROLL_BATCH = 20;

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
  const { products, maxPrice, isLoading: isCatalogLoading, hasMore, isLoadingMore, loadMore } =
    useCatalogProducts();
  const { filters, setFilters, resetFilters } = useShopFiltersUrl(maxPrice);
  const search = useProductSearch(filters.query);
  const { auth } = useApp();
  const cardLayoutExperiment = useAbExperiment("shop_card_layout_v1");

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
  const landingFiltered = useMemo(() => {
    if (!seoLanding) return filtered;
    return filtered.filter((p) => {
      if (seoLanding.facet === "stone") return productMatchesStoneFilter(p, [seoLanding.slug]);
      if (seoLanding.facet === "style") return p.category === seoLanding.slug;
      const occasions = p.occasions ?? [];
      return occasions.includes(seoLanding.slug as ProductOccasion);
    });
  }, [filtered, seoLanding]);

  const campaignFiltered = useMemo(() => {
    if (!shopCampaign) return landingFiltered;
    return landingFiltered.filter((p) =>
      productMatchesCampaignTarget(
        { productId: p.id, collectionId: p.collectionId ?? null },
        shopCampaign
      )
    );
  }, [landingFiltered, shopCampaign]);
  const preferenceSorted = useMemo(() => {
    const prefStone = auth.user?.favoriteStone;
    const prefStyle = auth.user?.favoriteStyle;
    const prefBudget = auth.user?.favoriteBudgetBand;
    if (!prefStone && !prefStyle && !prefBudget) return campaignFiltered;

    const budgetOf = (price: number): "entry" | "mid" | "premium" | "luxury" => {
      if (price <= 40_000_000) return "entry";
      if (price <= 90_000_000) return "mid";
      if (price <= 180_000_000) return "premium";
      return "luxury";
    };

    return [...campaignFiltered].sort((a, b) => {
      const score = (p: Product) => {
        let s = 0;
        if (prefStone && p.stone === prefStone) s += 5;
        if (prefStyle && p.category === prefStyle) s += 5;
        if (prefBudget && budgetOf(p.price) === prefBudget) s += 4;
        if (p.featured) s += 2;
        if (p.bestseller) s += 1;
        return s;
      };
      const delta = score(b) - score(a);
      if (delta !== 0) return delta;
      return 0;
    });
  }, [campaignFiltered, auth.user?.favoriteStone, auth.user?.favoriteStyle, auth.user?.favoriteBudgetBand]);
  const sorted = useMemo(() => sortShopProducts(preferenceSorted, sort), [preferenceSorted, sort]);
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
  const cardUiQaMode = false;
  const displayProducts = sorted;
  const timerOverridesByProductId = useMemo(() => {
    if (!cardUiQaMode) return undefined;
    return Object.fromEntries(
      sorted.map((product, idx) => {
        const group = idx % 4;
        const hasTimer = group === 0 || group === 2;
        return [product.id, hasTimer];
      })
    ) as Record<string, boolean>;
  }, [cardUiQaMode, sorted]);
  const cardVariant = cardLayoutExperiment.variantId === "compact_grid" ? "compact" : "grid";

  const isLoading = isCatalogLoading || (isSearchMode && search.isSearching);
  const showSearchError = isSearchMode && search.searchFailed && !search.isSearching;

  const filterResetKey = useMemo(
    () => `${JSON.stringify(filters)}|${isSearchMode ? search.resolvedQuery : "catalog"}|${sort}`,
    [filters, isSearchMode, search.resolvedQuery, sort]
  );

  const [visibleCount, setVisibleCount] = useState(SHOP_SCROLL_BATCH);
  const [isAppending, setIsAppending] = useState(false);
  const appendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisibleCount(SHOP_SCROLL_BATCH);
    setIsAppending(false);
    if (appendTimerRef.current) {
      clearTimeout(appendTimerRef.current);
      appendTimerRef.current = null;
    }
  }, [filterResetKey]);

  useEffect(() => {
    return () => {
      if (appendTimerRef.current) clearTimeout(appendTimerRef.current);
    };
  }, []);

  const visibleProducts = useMemo(
    () => displayProducts.slice(0, visibleCount),
    [displayProducts, visibleCount]
  );

  const canRevealMore = visibleCount < displayProducts.length;
  const canFetchMoreCatalog = hasMore && !isSearchMode;
  const canLoadMore = canRevealMore || canFetchMoreCatalog;
  const isScrollLoading = isAppending || isLoadingMore;

  const handleLoadMore = useCallback(() => {
    if (isScrollLoading) return;

    const revealNextBatch = () => {
      setVisibleCount((prev) => prev + SHOP_SCROLL_BATCH);
      setIsAppending(false);
      appendTimerRef.current = null;
    };

    const scheduleReveal = () => {
      if (appendTimerRef.current) clearTimeout(appendTimerRef.current);
      appendTimerRef.current = setTimeout(revealNextBatch, 450);
    };

    setIsAppending(true);

    if (canRevealMore) {
      scheduleReveal();
      return;
    }

    if (canFetchMoreCatalog) {
      void loadMore().finally(() => {
        scheduleReveal();
      });
      return;
    }

    setIsAppending(false);
  }, [isScrollLoading, canRevealMore, canFetchMoreCatalog, loadMore]);

  const loadMoreSentinelRef = useInfiniteScroll({
    enabled: !isLoading && displayProducts.length > 0 && canLoadMore && !isScrollLoading,
    recheckKey: `${visibleCount}|${displayProducts.length}|${hasMore}|${isScrollLoading}`,
    rootMargin: "240px 0px",
    onLoadMore: handleLoadMore,
  });

  // Keep fetching catalog pages while filters match nothing in the loaded set.
  useEffect(() => {
    if (isLoading || isSearchMode || isLoadingMore) return;
    if (displayProducts.length === 0 && hasMore) {
      void loadMore();
    }
  }, [isLoading, isSearchMode, isLoadingMore, displayProducts.length, hasMore, loadMore]);

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
                ) : displayProducts.length === 0 && !isSearchMode && (isLoadingMore || hasMore) ? (
                  <div className="shop-product-grid" aria-busy="true">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <ProductCardSkeleton key={`filter-more-${idx}`} />
                    ))}
                  </div>
                ) : displayProducts.length === 0 ? (
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
                  <>
                    <ShopProductGrid
                      products={visibleProducts}
                      cardVariant={cardVariant}
                      loadingCount={isScrollLoading ? Math.min(SHOP_SCROLL_BATCH, 8) : 0}
                      abTest={{
                        experimentId: cardLayoutExperiment.experimentId,
                        variantId: cardLayoutExperiment.variantId,
                        identity: cardLayoutExperiment.identity,
                        page: "/shop",
                      }}
                      timerOverridesByProductId={timerOverridesByProductId}
                    />
                    {canLoadMore || isScrollLoading ? (
                      <div ref={loadMoreSentinelRef} className="h-px w-full" aria-hidden />
                    ) : null}
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
