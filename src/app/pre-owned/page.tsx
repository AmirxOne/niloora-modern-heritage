"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { Recycle, ShoppingBag, Hammer } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import type { Product } from "@/lib/types";

export default function PreOwnedPage() {
  const [preOwnedProducts, setPreOwnedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/products/pre-owned");
        if (!response.ok) return;
        const data = (await response.json()) as { products: Product[] };
        if (!cancelled) {
          setPreOwnedProducts(data.products ?? []);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageTransition>
      <div className="pre-owned-page min-h-screen pb-16 pt-24 md:pt-28">
        <div className="site-container">
          <header className="pre-owned-page-header">
            <span className="heritage-eyebrow">{fa.preOwned.eyebrow}</span>
            <h1 className="pre-owned-page-title">{fa.preOwned.title}</h1>
            <p className="pre-owned-page-subtitle">{fa.preOwned.subtitle}</p>
            <div className="pre-owned-page-header-actions">
              <Link href="/shop?condition=pre-owned">
                <Button>{fa.preOwned.browseCta}</Button>
              </Link>
              <Link href="/pre-owned/sell">
                <Button variant="outline">{fa.preOwned.sellCta}</Button>
              </Link>
            </div>
          </header>

          <div className="pre-owned-landing-grid">
            <article className="pre-owned-landing-card">
              <ShoppingBag size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
              <h2>{fa.preOwned.landing.buyTitle}</h2>
              <p>{fa.preOwned.landing.buyBody}</p>
            </article>
            <article className="pre-owned-landing-card">
              <Recycle size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
              <h2>{fa.preOwned.landing.sellTitle}</h2>
              <p>{fa.preOwned.landing.sellBody}</p>
            </article>
            <article className="pre-owned-landing-card">
              <Hammer size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
              <h2>{fa.preOwned.landing.remakeTitle}</h2>
              <p>{fa.preOwned.landing.remakeBody}</p>
            </article>
          </div>

          <section className="pre-owned-page-catalog" aria-label={fa.preOwned.shopStripTitle}>
            <h2 className="pre-owned-page-catalog-title">{fa.preOwned.shopStripTitle}</h2>
            {isLoading ? (
              <div className="shop-product-grid" aria-busy="true">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            ) : (
              <ShopProductGrid products={preOwnedProducts} />
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
