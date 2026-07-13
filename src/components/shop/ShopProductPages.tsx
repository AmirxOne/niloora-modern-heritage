"use client";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { cn } from "@/lib/utils";

export type ShopProductDisplayPage = {
  id: string;
  products: Product[];
};

interface ShopProductPagesProps {
  pages: ShopProductDisplayPage[];
  isLoadingMore?: boolean;
  skeletonCount?: number;
  timerOverridesByProductId?: Record<string, boolean>;
  cardVariant?: "grid" | "compact";
  abTest?: {
    experimentId: string;
    variantId: string;
    identity: string;
    page: string;
  };
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
  showSentinel?: boolean;
}

/**
 * One continuous responsive grid (3/4/5 cols by breakpoint).
 * Pages stay append-only in data, but render into a single grid so incomplete
 * rows never leave a hole when the next page loads.
 */
export function ShopProductPages({
  pages,
  isLoadingMore = false,
  skeletonCount = 8,
  timerOverridesByProductId,
  cardVariant = "grid",
  abTest,
  sentinelRef,
  showSentinel = false,
}: ShopProductPagesProps) {
  const gridClass =
    cardVariant === "compact" ? "shop-product-grid shop-product-grid--compact" : "shop-product-grid";

  return (
    <div className="shop-product-pages">
      <div className={cn(gridClass, isLoadingMore && "shop-product-grid--loading-more")}>
        {pages.map((page) =>
          page.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compact={cardVariant === "compact"}
              timerOverride={timerOverridesByProductId?.[product.id]}
              abTest={abTest}
            />
          ))
        )}
        {isLoadingMore
          ? Array.from({ length: skeletonCount }).map((_, idx) => (
              <ProductCardSkeleton key={`page-skel-${idx}`} />
            ))
          : null}
      </div>
      {showSentinel ? (
        <div ref={sentinelRef} className="shop-scroll-sentinel" aria-hidden />
      ) : null}
    </div>
  );
}
