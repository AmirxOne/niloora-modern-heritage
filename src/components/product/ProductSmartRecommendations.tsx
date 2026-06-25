"use client";

import type { Product } from "@/lib/types";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { fa } from "@/lib/i18n/fa";

type RecommendationGroup = {
  title: string;
  subtitle: string;
  products: Product[];
};

interface ProductSmartRecommendationsProps {
  similar: Product[];
  complementary: Product[];
  budget: Product[];
}

export function ProductSmartRecommendations({
  similar,
  complementary,
  budget,
}: ProductSmartRecommendationsProps) {
  const groups: RecommendationGroup[] = [
    {
      title: fa.product.smartRecommendations.similarTitle,
      subtitle: fa.product.smartRecommendations.similarSubtitle,
      products: similar,
    },
    {
      title: fa.product.smartRecommendations.complementaryTitle,
      subtitle: fa.product.smartRecommendations.complementarySubtitle,
      products: complementary,
    },
    {
      title: fa.product.smartRecommendations.budgetTitle,
      subtitle: fa.product.smartRecommendations.budgetSubtitle,
      products: budget,
    },
  ].filter((group) => group.products.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="product-smart-recommendations" aria-label={fa.product.smartRecommendations.title}>
      <div className="product-smart-recommendations__groups">
        {groups.map((group) => (
          <section key={group.title} className="product-smart-recommendations__group">
            <header className="product-smart-recommendations__group-head">
              <h3 className="product-smart-recommendations__group-title">{group.title}</h3>
              <p className="product-smart-recommendations__group-subtitle">{group.subtitle}</p>
            </header>
            <ShopProductGrid products={group.products} className="product-smart-recommendations__grid" />
          </section>
        ))}
      </div>
    </section>
  );
}
