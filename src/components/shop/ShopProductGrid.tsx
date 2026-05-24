"use client";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/ProductCard";

interface ShopProductGridProps {
  products: Product[];
  className?: string;
  timerOverridesByProductId?: Record<string, boolean>;
  cardVariant?: "grid" | "compact";
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
  abTest,
}: ShopProductGridProps) {
  return (
    <div
      className={
        className ?? (cardVariant === "compact" ? "shop-product-grid shop-product-grid--compact" : "shop-product-grid")
      }
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
    </div>
  );
}
