"use client";

import { PRODUCT_AVAILABILITY_OPTIONS, getProductStatusConfig } from "@/lib/product-status";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, SliderHorizontal } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface ShopAvailabilityLegendProps {
  className?: string;
  filtersOpen?: boolean;
  activeFilterCount?: number;
  onToggleFilters?: () => void;
  sortValue?: string;
  sortOptions?: { value: string; label: string }[];
  onSortChange?: (value: string) => void;
}

export function ShopAvailabilityLegend({
  className,
  filtersOpen,
  activeFilterCount = 0,
  onToggleFilters,
  sortValue,
  sortOptions,
  onSortChange,
}: ShopAvailabilityLegendProps) {
  return (
    <aside className={cn("shop-availability-legend", className)} aria-label={fa.shop.availabilityLegend}>
      <div className="shop-availability-legend-head">
        <p className="shop-availability-legend-title">{fa.shop.availabilityLegend}</p>
        {onToggleFilters ? (
          <button
            type="button"
            onClick={onToggleFilters}
            className={cn(
              "shop-filter-toggle lg:hidden",
              filtersOpen && "shop-filter-toggle--open"
            )}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal
              className="h-4 w-4 shrink-0"
              size={iconSizes.sm}
              variant={ICON_VARIANT}
              aria-hidden
            />
            <span>{filtersOpen ? fa.shop.filtersClose : fa.shop.filtersToggle}</span>
            {activeFilterCount > 0 ? (
              <span
                className="shop-filter-badge"
                aria-label={fa.shop.activeFilters(activeFilterCount)}
              >
                {activeFilterCount.toLocaleString("fa-IR")}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
      <ul className="shop-availability-legend-list">
        {PRODUCT_AVAILABILITY_OPTIONS.map((key) => {
          const config = getProductStatusConfig(key);
          return (
            <li key={key} className="shop-availability-legend-item">
              <span className={`product-status-badge product-status--${config.tone} product-status-badge--sm`}>
                {config.shortLabel}
              </span>
              <span className="shop-availability-legend-hint">{config.deliveryHint}</span>
            </li>
          );
        })}
      </ul>
      {sortValue && sortOptions && sortOptions.length > 0 && onSortChange ? (
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
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSortChange(option.value)}
                className={cn(
                  "shop-sort-box-option",
                  sortValue === option.value && "shop-sort-box-option--active"
                )}
                aria-pressed={sortValue === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
