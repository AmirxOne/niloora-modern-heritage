"use client";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";

interface ShopProductGridProps {
  products: Product[];
  className?: string;
  timerOverridesByProductId?: Record<string, boolean>;
  cardVariant?: "grid" | "compact";
  /** Appends skeleton cards at the end of the grid (infinite-scroll loading). */
  loadingCount?: number;
  abTest?: {
    experimentId: string;
    variantId: string;
    identity: string;
    page: string;
  };
}

export function ShopProductGrid({
  products,
  className,
  timerOverridesByProductId,
  cardVariant = "grid",
  loadingCount = 0,
  abTest,
}: ShopProductGridProps) {
  return (
    <div
      className={
        className ?? (cardVariant === "compact" ? "shop-product-grid shop-product-grid--compact" : "shop-product-grid")
      }
      aria-busy={loadingCount > 0 ? true : undefined}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          compact={cardVariant === "compact"}
          timerOverride={timerOverridesByProductId?.[product.id]}
          abTest={abTest}
        />
      ))}
      {loadingCount > 0
        ? Array.from({ length: loadingCount }).map((_, idx) => (
            <ProductCardSkeleton key={`scroll-skel-${idx}`} />
          ))
        : null}
    </div>
  );
}
