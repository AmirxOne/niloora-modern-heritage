"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProductCompareSkeleton } from "@/components/compare/ProductCompareSkeleton";
import { ProductCompareTable } from "@/components/compare/ProductCompareTable";
import { useApp } from "@/lib/context/AppContext";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import { MAX_COMPARE_PRODUCTS } from "@/lib/product-lists/constants";

export default function ComparePage() {
  const { compareList } = useApp();
  const { products, isLoading: catalogLoading } = useProductsByIds(compareList.ids);
  const visibleProducts = useMemo(
    () => products.slice(0, MAX_COMPARE_PRODUCTS),
    [products]
  );

  const isPreparing =
    !compareList.hydrated || (compareList.count > 0 && catalogLoading);

  return (
    <PageTransition>
      <div className="site-container py-10 md:py-14">
        <header className="compare-page__header">
          <div>
            <h1 className="compare-page__title">{fa.compare.title}</h1>
            <p className="compare-page__subtitle">{fa.compare.subtitle(compareList.max)}</p>
          </div>
          {!isPreparing && compareList.count > 0 ? (
            <Button variant="outline" size="sm" onClick={() => compareList.clear()}>
              {fa.compare.clearAll}
            </Button>
          ) : null}
        </header>

        {isPreparing ? (
          <ProductCompareSkeleton
            columns={compareList.count > 0 ? compareList.count : 2}
          />
        ) : visibleProducts.length === 0 ? (
          <UnifiedEmptyState
            visual="compare"
            title={fa.compare.emptyTitle}
            description={fa.compare.emptyHint}
            className="compare-page__empty"
            action={
              <Link href="/shop">
                <Button>{fa.compare.browseShop}</Button>
              </Link>
            }
          />
        ) : (
          <ProductCompareTable products={visibleProducts} />
        )}
      </div>
    </PageTransition>
  );
}
