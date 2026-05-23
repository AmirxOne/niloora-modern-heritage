"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ProductPriceDisplay } from "@/components/product/ProductPriceDisplay";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import type { Product } from "@/lib/types";
import type { ProductPagePayload } from "@/lib/server/products/product-page";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductAvailabilityPanel } from "@/components/product/ProductAvailabilityPanel";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { getProductStatusConfig } from "@/lib/product-status";
import { ProductComments } from "@/components/product/ProductComments";
import { ProductQuestions } from "@/components/product/ProductQuestions";
import { ProductSectionNav } from "@/components/product/ProductSectionNav";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
import { ProductCompareButton } from "@/components/product/ProductCompareButton";
import { DiscountCountdown } from "@/components/commerce/DiscountCountdown";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
import { ProductRating } from "@/components/product/ProductRating";
import { ProductSalesCount } from "@/components/product/ProductSalesCount";
import { PreOwnedBadge } from "@/components/pre-owned/PreOwnedBadge";
import { PreOwnedProductPanel } from "@/components/pre-owned/PreOwnedProductPanel";
import { ProductContentBrief } from "@/components/product/ProductContentBrief";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { ProductIntroVideo } from "@/components/product/ProductIntroVideo";
import { isPreOwnedProduct } from "@/lib/pre-owned";

type Props = {
  productId: string;
  initialPayload?: ProductPagePayload | null;
};

function applyPayload(
  payload: ProductPagePayload,
  setProduct: (p: Product) => void,
  setRelated: (r: Product[]) => void
) {
  setProduct(payload.product);
  setRelated(payload.related);
}

export function ProductPageClient({ productId, initialPayload }: Props) {
  const [product, setProduct] = useState<Product | null>(initialPayload?.product ?? null);
  const [related, setRelated] = useState<Product[]>(initialPayload?.related ?? []);
  const [isLoading, setIsLoading] = useState(!initialPayload);
  const [isMissing, setIsMissing] = useState(false);
  const { cart, wishlist, recentlyViewed } = useApp();
  const trackRecentlyViewed = recentlyViewed.trackView;
  useEffect(() => {
    let cancelled = false;
    const hasInitial = initialPayload?.product.id === productId;

    async function load() {
      if (!hasInitial) setIsLoading(true);
      const payload = await fetchProductPayload(productId);
      if (cancelled) return;
      if (!payload) {
        setIsMissing(true);
        setIsLoading(false);
        return;
      }
      applyPayload(payload, setProduct, setRelated);
      setIsMissing(false);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [productId, initialPayload]);

  useEffect(() => {
    if (product?.id) {
      trackRecentlyViewed(product.id);
    }
  }, [product?.id, trackRecentlyViewed]);

  if (isMissing) {
    notFound();
  }

  if (isLoading || !product) {
    return (
      <div className="site-container py-16" aria-busy="true">
        <div className="product-detail-grid">
          <div className="product-detail-media">
            <div className="sk aspect-[4/5] w-full rounded-heritage-lg" />
          </div>
          <div className="product-detail-info">
            <header className="product-detail-header">
              <div className="sk h-3 w-28" />
              <div className="sk mt-3 h-3 w-44" />
              <div className="sk mt-2 h-7 w-72 max-w-full" />
              <div className="sk mt-4 h-3 w-36" />
              <div className="sk mt-5 h-6 w-40" />
            </header>
            <div className="product-detail-section space-y-2">
              <div className="sk h-3 w-full" />
              <div className="sk h-3 w-11/12" />
              <div className="sk h-3 w-9/12" />
            </div>
            <div className="product-detail-actions">
              <div className="sk h-12 w-full rounded-heritage-pill" />
              <div className="product-detail-actions-secondary">
                <div className="sk h-12 w-full rounded-heritage-pill" />
                <div className="sk h-12 w-full rounded-heritage-pill" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const status = getProductStatusConfig(product.availability);
  const canBuy = isProductPurchasable(
    {
      name: product.namePersian || product.name,
      availability: product.availability,
      stock: product.stock,
    },
    1
  );

  return (
    <div className="product-detail-page">
      <div className="site-container">
        <ProductBreadcrumb productName={product.name} />

        <div className="product-detail-grid">
          <div className="product-detail-media">
            <ProductGallery images={images} name={product.name} productId={product.id} />
          </div>

          <div className="product-detail-info">
            <div className="product-detail-top-layout">
              <header className="product-detail-header">
                <div className="product-detail-badges mb-3 flex flex-wrap gap-2">
                  {isPreOwnedProduct(product) ? <PreOwnedBadge size="md" /> : null}
                  {product.collection ? (
                    <Badge variant="turquoise" className="w-fit">
                      {product.collection}
                    </Badge>
                  ) : null}
                </div>
                <p className="product-detail-name-persian">{product.namePersian}</p>
                <h1 className="product-detail-title">{product.name}</h1>
                <div className="product-detail-meta">
                  <ProductRating productId={product.id} size="md" />
                  <ProductSalesCount productId={product.id} />
                </div>
                <ProductContentBrief listing={product.listing} className="product-detail-description" />
                {product.introVideoUrl ? (
                  <ProductIntroVideo
                    url={product.introVideoUrl}
                    title={product.namePersian || product.name}
                    className="product-detail-intro-video"
                  />
                ) : null}
              </header>

              <aside className="product-detail-side-panel">
                <div className="product-detail-price">
                  <ProductPriceDisplay product={product} size="lg" layout="stack" />
                  <DiscountCountdown
                    productId={product.id}
                    endsAt={product.discountEndsAt}
                    className="product-detail-discount-countdown"
                  />
                </div>

                <div className="product-detail-actions">
                  <Button
                    size="lg"
                    className="product-detail-actions-primary product-detail-actions-btn"
                    disabled={!canBuy}
                    onClick={() => cart.addProduct(product.id)}
                  >
                    {canBuy ? (
                      <>
                        <span className="md:hidden">{fa.product.addToCart}</span>
                        <span className="hidden md:inline">{status.addToCartLabel}</span>
                      </>
                    ) : (
                      fa.commerce.quickAddSoldOut
                    )}
                  </Button>
                  <div className="product-detail-actions-secondary">
                    <ProductCompareButton productId={product.id} variant="detail" />
                  </div>
                </div>

                <p className="product-detail-checkout-hint">{fa.commerce.productCheckoutHint}</p>

                <section className="product-detail-side-section" aria-labelledby="product-availability-heading">
                  <h2 id="product-availability-heading" className="product-detail-section-title">
                    {fa.product.availabilityTitle}
                  </h2>
                  <ProductAvailabilityPanel availability={product.availability} />
                </section>
              </aside>
            </div>

            <div id="product-section-intro" />

            <PreOwnedProductPanel product={product} />

          </div>
        </div>

        <ProductSectionNav className="product-detail-section-nav" />

        <section
          id="product-section-specs"
          className="product-detail-specs-content"
          aria-label={fa.product.featuresTitle}
        >
          <ProductSpecs product={product} />
        </section>

        <SalesTrustStrip variant="dense" className="product-detail-trust" />

        <section id="product-section-comments" className="product-detail-comments">
          <ProductComments productId={product.id} />
        </section>

        <section id="product-section-questions" className="product-detail-questions">
          <ProductQuestions productId={product.id} />
        </section>

        <RecentlyViewedStrip
          excludeProductId={product.id}
          className="product-detail-recently-viewed"
        />

        {related.length > 0 ? (
          <section className="product-detail-related">
            <h2 className="product-detail-related-title">{fa.product.related}</h2>
            <ShopProductGrid products={related} className="product-detail-related-grid" />
          </section>
        ) : null}
      </div>
    </div>
  );
}

async function fetchProductPayload(id: string): Promise<ProductPagePayload | null> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
  if (!response.ok) return null;
  return (await response.json()) as ProductPagePayload;
}
