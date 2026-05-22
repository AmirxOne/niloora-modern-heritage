"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "@/components/icons";
import type { ShopFilters as Filters } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import {
  availabilityFilterOptions,
  collectionFilterOptions,
  collectionIdFilterOptions,
  conditionFilterOptions,
  engravingFilterOptions,
  stoneFilterOptions,
  styleFilterOptions,
  hasActiveFilters,
  countActiveFilters,
} from "@/lib/shop-filter-utils";
import { FilterMultiSelect } from "@/components/ui/FilterMultiSelect";
import { PriceRangeFilter, PriceRangeFilterSkeleton } from "@/components/shop/PriceRangeFilter";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface ShopFiltersPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  maxPrice: number;
  priceRangeReady?: boolean;
  onReset?: () => void;
  onClose?: () => void;
  /** موبایل: داخل دراور؛ دسکتاپ: سایدبار */
  variant?: "sidebar" | "drawer";
}

export function ShopFiltersPanel({
  filters,
  onChange,
  maxPrice,
  priceRangeReady = true,
  onReset,
  onClose,
  variant = "sidebar",
}: ShopFiltersPanelProps) {
  const isSidebar = variant === "sidebar";
  const showReset = onReset && hasActiveFilters(filters, maxPrice);
  const activeCount = countActiveFilters(filters, maxPrice);

  const patch = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div
      className={
        isSidebar ? "shop-filters-panel shop-filters-panel--sidebar" : "shop-filters-panel"
      }
    >
      <header className="shop-filters-panel-header">
        <div className="shop-filters-panel-header-row">
          <h2 className="shop-filters-panel-title">{fa.shop.refine}</h2>
          <div className="shop-filters-panel-actions">
            {showReset ? (
              <button
                type="button"
                onClick={onReset}
                className="shop-filter-reset"
                aria-label={fa.shop.activeFilters(activeCount)}
              >
                {fa.shop.clearFilterWithCount(activeCount)}
              </button>
            ) : null}
            {!isSidebar && onClose ? (
              <button type="button" onClick={onClose} className="shop-filter-reset">
                {fa.shop.filtersClose}
              </button>
            ) : null}
          </div>
        </div>
        {!isSidebar ? (
          <p className="shop-filters-panel-hint">{fa.shop.filterPanelHint}</p>
        ) : null}
      </header>

      <div className="shop-filters-layout shop-filters-layout--sidebar">
        <div className="shop-filter-field">
          <h3 className="shop-filter-section-title">جستجو در گالری</h3>
          <div className="shop-filter-search-wrap">
            <Search
              size={iconSizes.sm}
              variant={ICON_VARIANT}
              className="shop-filter-search-icon"
              aria-hidden
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => patch("query", e.target.value)}
              placeholder={fa.nav.searchPlaceholder}
              className="shop-filter-search-input"
              aria-label={fa.nav.search}
            />
            {filters.query ? (
              <button
                type="button"
                className="shop-filter-search-clear"
                onClick={() => patch("query", "")}
                aria-label={fa.common.remove}
              >
                <X size={iconSizes.xs} variant={ICON_VARIANT} />
              </button>
            ) : null}
          </div>
        </div>

        <FilterMultiSelect
          label={fa.shop.collection}
          options={collectionFilterOptions}
          value={filters.collections}
          onChange={(collections) => patch("collections", collections)}
        />

        <FilterMultiSelect
          label={fa.shop.collectionReal}
          options={collectionIdFilterOptions}
          value={filters.collectionIds}
          onChange={(collectionIds) => patch("collectionIds", collectionIds)}
        />

        <FilterMultiSelect
          label={fa.shop.condition}
          options={conditionFilterOptions}
          value={filters.conditions}
          onChange={(conditions) => patch("conditions", conditions)}
        />

        <FilterMultiSelect
          label={fa.shop.stone}
          options={stoneFilterOptions}
          value={filters.stones}
          onChange={(stones) => patch("stones", stones)}
        />

        <FilterMultiSelect
          label={fa.shop.style}
          options={styleFilterOptions}
          value={filters.styles}
          onChange={(styles) => patch("styles", styles)}
        />

        <FilterMultiSelect
          label={fa.shop.engraving}
          options={engravingFilterOptions}
          value={filters.engravingTypes}
          onChange={(engravingTypes) => patch("engravingTypes", engravingTypes)}
        />

        <FilterMultiSelect
          label={fa.shop.availability}
          options={availabilityFilterOptions}
          value={filters.availabilities}
          onChange={(availabilities) => patch("availabilities", availabilities)}
        />

        <div className="shop-filter-field shop-filter-field--price">
          <h3 className="shop-filter-section-title">{fa.shop.priceRange}</h3>
          {priceRangeReady && maxPrice > 0 ? (
            <PriceRangeFilter
              min={filters.priceRange[0]}
              max={filters.priceRange[1]}
              ceiling={maxPrice}
              onChange={(priceRange) => patch("priceRange", priceRange)}
            />
          ) : (
            <PriceRangeFilterSkeleton />
          )}
        </div>
      </div>

      {showReset ? (
        <footer className="shop-filters-panel-footer">
          <button type="button" onClick={onReset} className="shop-filter-reset shop-filter-reset--block">
            {fa.shop.clearFilters}
          </button>
        </footer>
      ) : null}
    </div>
  );
}

interface ShopFiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
  maxPrice: number;
  priceRangeReady?: boolean;
  onReset: () => void;
}

export function ShopFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  maxPrice,
  priceRangeReady = true,
  onReset,
}: ShopFiltersDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="shop-filters-backdrop"
            aria-label={fa.shop.filtersClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="shop-filters-drawer"
            role="dialog"
            aria-modal
            aria-label={fa.shop.refine}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ShopFiltersPanel
              filters={filters}
              onChange={onChange}
              maxPrice={maxPrice}
              priceRangeReady={priceRangeReady}
              onClose={onClose}
              onReset={() => {
                onReset();
              }}
              variant="drawer"
            />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
