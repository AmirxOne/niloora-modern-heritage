"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductPriceDisplay } from "@/components/product/ProductPriceDisplay";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import type { Product } from "@/lib/types";
import type { ProductPagePayload } from "@/lib/server/products/product-page";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { Button } from "@/components/ui/Button";
import { ProductAvailabilityPanel } from "@/components/product/ProductAvailabilityPanel";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { getProductStatusConfig } from "@/lib/product-status";
import { ProductComments } from "@/components/product/ProductComments";
import { ProductQuestions } from "@/components/product/ProductQuestions";
import { ProductSectionNav, scrollToProductSection } from "@/components/product/ProductSectionNav";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
import { ProductCompareButton } from "@/components/product/ProductCompareButton";
import { DiscountCountdown } from "@/components/commerce/DiscountCountdown";
import { ProductRating } from "@/components/product/ProductRating";
import { ProductSalesCount } from "@/components/product/ProductSalesCount";
import { ProductSalesStat } from "@/components/product/ProductSalesStat";
import { PreOwnedProductPanel } from "@/components/pre-owned/PreOwnedProductPanel";
import { ProductContentBrief } from "@/components/product/ProductContentBrief";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { MobileProductBuyBar } from "@/components/product/MobileProductBuyBar";
import { PieceNumber } from "@/components/product/PieceNumber";
import { getProductDisplayName } from "@/lib/products/product-display-name";
import { resolvePieceCode } from "@/lib/products/piece-code";
import { ProductIntroVideo } from "@/components/product/ProductIntroVideo";
import { ProductArtisansPanel } from "@/components/product/ProductArtisansPanel";
import { ProductStoneInsight } from "@/components/product/ProductStoneInsight";
import { BackInStockAlertCard } from "@/components/product/BackInStockAlertCard";
import { ProductSmartRecommendations } from "@/components/product/ProductSmartRecommendations";
import { ProductBundleOffersPanel } from "@/components/product/ProductBundleOffersPanel";
import { ProductAuthenticityCard } from "@/components/product/ProductAuthenticityCard";
import { ProductVendorPanel } from "@/components/product/ProductVendorPanel";
import { ProductVendorProductsRail } from "@/components/product/ProductVendorProductsRail";
import { toast } from "sonner";
import { trackFunnelEvent } from "@/lib/analytics/client";
import { RingCustomizationEditor } from "@/components/cart/RingCustomizationEditor";
import { ProductDetailTrustCards } from "@/components/product/ProductDetailTrustCards";

type Props = {
  productId: string;
  initialPayload?: ProductPagePayload | null;
};

function applyPayload(
  payload: ProductPagePayload,
  setProduct: (p: Product) => void,
  setRelated: (r: Product[]) => void,
  setVendorProducts: (r: Product[]) => void,
  setSmartRecommendations: (r: ProductPagePayload["smartRecommendations"]) => void,
  setActiveBundles: (r: ProductPagePayload["activeBundles"]) => void
) {
  setProduct(payload.product);
  setRelated(payload.related);
  setVendorProducts(payload.vendorProducts);
  setSmartRecommendations(payload.smartRecommendations);
  setActiveBundles(payload.activeBundles);
}

export function ProductPageClient({ productId, initialPayload }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialPayload?.product ?? null);
  const [related, setRelated] = useState<Product[]>(initialPayload?.related ?? []);
  const [vendorProducts, setVendorProducts] = useState<Product[]>(
    initialPayload?.vendorProducts ?? []
  );
  const [smartRecommendations, setSmartRecommendations] = useState<ProductPagePayload["smartRecommendations"]>(
    initialPayload?.smartRecommendations ?? { similar: [], complementary: [], budget: [] }
  );
  const [activeBundles, setActiveBundles] = useState<ProductPagePayload["activeBundles"]>(
    initialPayload?.activeBundles ?? []
  );
  const [isLoading, setIsLoading] = useState(!initialPayload);
  const [isMissing, setIsMissing] = useState(false);
  const { cart, wishlist, recentlyViewed } = useApp();
  const trackRecentlyViewed = recentlyViewed.trackView;
  const productCategory = product?.category;
  const productName = product?.name;
  const productPrice = product?.price;
  const productStone = product?.stone;
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
      applyPayload(
        payload,
        setProduct,
        setRelated,
        setVendorProducts,
        setSmartRecommendations,
        setActiveBundles
      );
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
      void trackFunnelEvent({
        event_name: "view_product",
        value: productPrice,
        items: [
          {
            item_id: product.id,
            item_name: product.namePersian?.trim() || productName,
            item_category: productCategory,
            item_variant: productStone,
            price: productPrice,
            quantity: 1,
          },
        ],
        dedupe_key: `view_product:${product.id}`,
      });
    }
  }, [
    product?.id,
    product?.namePersian,
    productCategory,
    productName,
    productPrice,
    productStone,
    trackRecentlyViewed,
  ]);

  if (isMissing) {
    notFound();
  }

  if (isLoading || !product) {
    return (
      <div className="site-container py-16" aria-busy="true">
        <div className="product-detail-grid">
          <div className="product-detail-media">
            <div className="sk aspect-[4/5] w-full rounded-heritage" />
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
              <div className="sk h-12 w-full rounded-heritage" />
              <div className="product-detail-actions-secondary">
                <div className="sk h-12 w-full rounded-heritage" />
                <div className="sk h-12 w-full rounded-heritage" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getProductDisplayName(product);
  const pieceCode = resolvePieceCode(product);
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const status = getProductStatusConfig(product.availability);
  const canBuyByStockRules = isProductPurchasable(
    {
      name: product.namePersian || product.name,
      availability: product.availability,
      stock: product.stock,
    },
    1
  );
  // وضعیت‌های غیر فوری (پیش‌فروش/فاخر/ساخت اختصاصی) وابسته به موجودی لحظه‌ای نیستند.
  const canAddToCart = status.isImmediate ? canBuyByStockRules : status.canAddToCart;
  const isRemakeRequest = product.availability === "sold";
  const productCartItem =
    cart.items.length > 0
      ? [...cart.items]
          .reverse()
          .find((item) => item.productId === product.id && !item.customizerState)
      : undefined;

  const handlePrimaryAction = () => {
    if (isRemakeRequest) {
      router.push(`/customize?source=remake&productId=${encodeURIComponent(product.id)}`);
      return;
    }
    if (canAddToCart) {
      cart.addProduct(product.id);
    }
  };

  const handleAddBundleToCart = async (bundle: ProductPagePayload["activeBundles"][number]) => {
    const otherProductIds = bundle.requiredProductIds.filter((id) => id !== product.id);
    for (const id of otherProductIds) {
      const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
      if (!response.ok) {
        toast.error(fa.product.bundleOffers.addFailedMissing);
        return;
      }
      const data = (await response.json()) as { product?: Product };
      if (!data.product) {
        toast.error(fa.product.bundleOffers.addFailedMissing);
        return;
      }
      await cart.addProduct(id, { navigateToCart: false });
    }
    toast.success(fa.product.bundleOffers.addSuccess);
    router.push("/cart");
  };

  return (
    <div className="product-detail-page">
      <div className="site-container">
        <ProductBreadcrumb productName={displayName} />

        <div className="product-detail-grid">
          <div className="product-detail-media">
            <ProductGallery images={images} name={displayName} productId={product.id} />
            <ProductStoneInsight product={product} className="product-detail-stone-insight" />
          </div>

          <div className="product-detail-info">
            <div className="product-detail-top-layout">
              <div className="product-detail-main">
                <header className="product-detail-header">
                <h1 className="product-detail-title">{displayName}</h1>
                <div className="product-detail-meta">
                  <ProductRating productId={product.id} size="md" />
                  <ProductSalesCount productId={product.id} />
                </div>
                <PieceNumber
                  code={pieceCode}
                  variant="card"
                  className="product-detail-piece-number"
                />
                <ProductContentBrief listing={product.listing} className="product-detail-description" />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="product-content-brief-view-more w-full"
                  onClick={() => scrollToProductSection("product-section-specs")}
                  aria-label={fa.product.viewMoreSpecsAria}
                >
                  {fa.product.viewMore}
                </Button>
                {product.introVideoUrl ? (
                  <ProductIntroVideo
                    url={product.introVideoUrl}
                    title={displayName}
                    className="product-detail-intro-video"
                  />
                ) : null}
                </header>

                <ProductArtisansPanel product={product} className="product-detail-artisans-panel" />
              </div>

              <aside className="product-detail-side-panel">
                <div className="product-detail-price">
                  <ProductPriceDisplay product={product} size="lg" layout="stack" />
                  <DiscountCountdown
                    productId={product.id}
                    endsAt={product.discountEndsAt}
                    className="product-detail-discount-countdown"
                  />
                </div>

                <ProductSalesStat
                  productId={product.id}
                  className="product-detail-sales-stat"
                />

                <div className="product-detail-actions">
                  <Button
                    size="lg"
                    className="product-detail-actions-primary product-detail-actions-btn"
                    disabled={!canAddToCart && !isRemakeRequest}
                    onClick={handlePrimaryAction}
                  >
                    {canAddToCart || isRemakeRequest ? (
                      <>
                        <span className="md:hidden">{status.addToCartLabel}</span>
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

                {productCartItem ? (
                  <RingCustomizationEditor
                    item={productCartItem}
                    className="mt-0"
                    onClear={() => {
                      const previousDelta =
                        productCartItem.ringPurchaseCustomization?.totalCustomizationDelta ?? 0;
                      if (!previousDelta) {
                        cart.updateRingCustomization(productCartItem.id, {
                          price: productCartItem.price,
                          listPrice: productCartItem.listPrice,
                          ringPurchaseCustomization: undefined,
                        });
                        return;
                      }
                      const basePrice = productCartItem.price - previousDelta;
                      const baseList =
                        (productCartItem.listPrice ?? productCartItem.price) - previousDelta;
                      cart.updateRingCustomization(productCartItem.id, {
                        price: basePrice,
                        listPrice: baseList,
                        ringPurchaseCustomization: undefined,
                      });
                    }}
                  />
                ) : (
                  <div className="mt-3 rounded-heritage border border-gold/15 bg-gradient-to-br from-parchment/35 to-parchment/15 p-3">
                    <div className="grid gap-0.5">
                      <p className="text-xs font-semibold text-ivory">شخصی‌سازی انگشتر</p>
                      <p className="text-[11px] text-silver">
                        برای حکاکی و قلم‌کاری اختصاصی، وارد مرحله شخصی‌سازی شوید.
                      </p>
                    </div>
                    <div className="mt-2.5">
                      <Link href={`/customize?productId=${encodeURIComponent(product.id)}`} className="block w-full">
                        <Button size="sm" variant="outline" className="w-full">
                          شخصی‌سازی خرید
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <section className="product-detail-side-section" aria-labelledby="product-availability-heading">
                  <h2 id="product-availability-heading" className="product-detail-section-title">
                    {fa.product.availabilityTitle}
                  </h2>
                  <ProductAvailabilityPanel availability={product.availability} />
                </section>

                <ProductAuthenticityCard product={product} />

                <ProductVendorPanel product={product} />
                <ProductBundleOffersPanel
                  product={product}
                  bundles={activeBundles}
                  onAddBundleToCart={handleAddBundleToCart}
                />
                <BackInStockAlertCard product={product} />
              </aside>
            </div>

            <div id="product-section-intro" />

          </div>

          <div className="product-detail-hero-meta">
            <ProductDetailTrustCards />
          </div>

          <div className="product-detail-pre-owned lg:col-span-2">
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

        <ProductVendorProductsRail
          products={vendorProducts}
          vendorName={product.vendor?.displayName}
        />

        {related.length > 0 ? (
          <section className="product-detail-related">
            <h2 className="product-detail-related-title">{fa.product.related}</h2>
            <ShopProductGrid products={related} className="product-detail-related-grid" />
          </section>
        ) : null}

        <ProductSmartRecommendations
          similar={smartRecommendations.similar}
          complementary={smartRecommendations.complementary}
          budget={smartRecommendations.budget}
        />
      </div>

      <MobileProductBuyBar product={product} />
    </div>
  );
}

async function fetchProductPayload(id: string): Promise<ProductPagePayload | null> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
  if (!response.ok) return null;
  return (await response.json()) as ProductPagePayload;
}
