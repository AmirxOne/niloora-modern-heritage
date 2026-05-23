"use client";

import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProductCompareTable } from "@/components/compare/ProductCompareTable";
import { useApp } from "@/lib/context/AppContext";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

export default function ComparePage() {
  const { compareList } = useApp();
  const products = useProductsByIds(compareList.ids);

  return (
    <PageTransition>
      <div className="site-container py-10 md:py-14">
        <header className="compare-page__header">
          <div>
            <p className="compare-page__eyebrow">{fa.brand.name}</p>
            <h1 className="compare-page__title">{fa.compare.title}</h1>
            <p className="compare-page__subtitle">{fa.compare.subtitle(compareList.max)}</p>
            <p className="compare-page__count">{fa.compare.countLabel(compareList.count, compareList.max)}</p>
          </div>
          {compareList.count > 0 ? (
            <Button variant="outline" size="sm" onClick={() => compareList.clear()}>
              {fa.compare.clearAll}
            </Button>
          ) : null}
        </header>

        {products.length === 0 ? (
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
          <ProductCompareTable products={products} />
        )}
      </div>
    </PageTransition>
  );
}
