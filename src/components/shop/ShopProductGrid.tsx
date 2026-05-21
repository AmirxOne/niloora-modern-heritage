"use client";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/ProductCard";

interface ShopProductGridProps {
  products: Product[];
  className?: string;
}

export function ShopProductGrid({ products, className }: ShopProductGridProps) {
  return (
    <div className={className ?? "shop-product-grid"}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
