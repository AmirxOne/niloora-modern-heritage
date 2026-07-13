"use client";

import { useApp } from "@/lib/context/AppContext";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { fa } from "@/lib/i18n/fa";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";

export function RecentlyViewedStrip({
  excludeProductId,
  className,
}: {
  excludeProductId?: string;
  className?: string;
}) {
  const { recentlyViewed } = useApp();
  const ids = recentlyViewed.ids.filter((id) => id !== excludeProductId);
  const { products } = useProductsByIds(ids);

  if (products.length === 0) return null;

  return (
    <section
      className={className ?? "product-detail-related"}
      aria-labelledby="recently-viewed-title"
    >
      <h2 id="recently-viewed-title" className="product-detail-related-title">
        {fa.product.recentlyViewedTitle}
      </h2>
      <ShopProductGrid products={products} className="product-detail-related-grid" />
    </section>
  );
}
