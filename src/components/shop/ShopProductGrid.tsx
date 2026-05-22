"use client";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/ProductCard";

interface ShopProductGridProps {
  products: Product[];
  className?: string;
  timerOverridesByProductId?: Record<string, boolean>;
}

export function ShopProductGrid({
  products,
  className,
  timerOverridesByProductId,
}: ShopProductGridProps) {
  return (
    <div className={className ?? "shop-product-grid"}>
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          timerOverride={timerOverridesByProductId?.[product.id]}
        />
      ))}
    </div>
  );
}
