"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductPriceDisplay } from "@/components/product/ProductPriceDisplay";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { getProductPricing } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import type { ProductPagePayload } from "@/lib/server/products/product-page";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import { Button } from "@/components/ui/Button";
import { ProductAvailabilityPanel } from "@/components/product/ProductAvailabilityPanel";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { getProductStatusConfig } from "@/lib/product-status";
import { ProductComments } from "@/components/product/ProductComments";
import { ProductQuestions } from "@/components/product/ProductQuestions";
import { ProductSectionNav, scrollToProductSectionNav } from "@/components/product/ProductSectionNav";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
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
import { ProductPageSkeleton } from "@/components/product/ProductPageSkeleton";

type Props = {
  productId: string;
  initialPayload?: ProductPagePayload | null;
};

function applyPayload(
  payload: ProductPagePayload,
  setProduct: (p: Product) => void,
  setVendorProducts: (r: Product[]) => void,
  setSmartRecommendations: (r: ProductPagePayload["smartRecommendations"]) => void,
  setActiveBundles: (r: ProductPagePayload["activeBundles"]) => void
) {
  setProduct(payload.product);
  setVendorProducts(payload.vendorProducts);
  setSmartRecommendations(payload.smartRecommendations);
  setActiveBundles(payload.activeBundles);
}

export function ProductPageClient({ productId, initialPayload }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialPayload?.product ?? null);
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
    return <ProductPageSkeleton />;
  }

  const displayName = getProductDisplayName(product);
  const pricing = getProductPricing(product);
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
          <div className="product-detail-hero-row">
            <div className="product-detail-media">
              <ProductGallery images={images} name={displayName} productId={product.id} />
            </div>

            <div className="product-detail-info">
              <div className="product-detail-top-layout">
              <header className="product-detail-header product-detail-top-layout__intro">
                <h1 className="product-detail-title">{displayName}</h1>
                <div className="product-detail-meta">
                  <ProductRating
                    productId={product.id}
                    size="md"
                    initialApproved={
                      initialPayload?.product.id === product.id
                        ? initialPayload.approvedComments
                        : undefined
                    }
                  />
                  <ProductSalesCount productId={product.id} />
                </div>
                <PieceNumber
                  code={pieceCode}
                  variant="card"
                  className="product-detail-piece-number"
                />
                <ProductContentBrief
                  listing={product.listing}
                  className="product-detail-description"
                  onViewMore={() => scrollToProductSectionNav()}
                />
              </header>

              <aside className="product-detail-side-panel product-detail-top-layout__commerce">
                <div className="product-detail-buybox" data-testid="buy-box">
                  <div className="product-detail-buybox__section product-detail-buybox__price">
                    <div className="product-detail-price">
                      <ProductPriceDisplay product={product} size="lg" layout="stack" showBadge={false} />
                      {pricing.hasProductFurooh || product.discountEndsAt ? (
                        <div className="product-detail-discount-row" dir="ltr">
                          {product.discountEndsAt ? (
                            <DiscountCountdown
                              productId={product.id}
                              endsAt={product.discountEndsAt}
                              className="product-detail-discount-countdown"
                            />
                          ) : null}
                          {pricing.hasProductFurooh ? (
                            <span
                              className="furooh-badge product-detail-discount-percent"
                              aria-label={fa.bahakahi.percentOff(pricing.furoohPercent)}
                            >
                              {fa.bahakahi.cardTag(pricing.furoohPercent)}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <ProductSalesStat
                      productId={product.id}
                      className="product-detail-sales-stat"
                    />
                  </div>

                  <div className="product-detail-buybox__section product-detail-buybox__actions">
                    <div className="product-detail-actions">
                      <Button
                        size="lg"
                        className="product-detail-actions-primary product-detail-actions-btn"
                        disabled={!canAddToCart && !isRemakeRequest}
                        onClick={handlePrimaryAction}
                      >
                        {canAddToCart || isRemakeRequest ? (
                          status.addToCartLabel
                        ) : (
                          fa.commerce.quickAddSoldOut
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="product-detail-buybox__section product-detail-buybox__customization">
                    {productCartItem ? (
                      <RingCustomizationEditor
                        item={productCartItem}
                        className="product-detail-buybox__customization-panel"
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
                      <div className="product-detail-buybox__customization-panel">
                        <div className="grid gap-0.5">
                          <p className="text-xs font-semibold text-ivory">شخصی‌سازی انگشتر</p>
                          <p className="text-[11px] text-silver">
                            برای حکاکی و قلم‌کاری اختصاصی، وارد مرحله شخصی‌سازی شوید.
                          </p>
                        </div>
                        <div className="mt-2.5">
                          <Link href={`/customize?productId=${encodeURIComponent(product.id)}`} className="block w-full">
                            <Button size="sm" variant="outline" className="w-full">
                              شخصی‌سازی
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <section
                    className="product-detail-buybox__section product-detail-buybox__availability"
                    aria-labelledby="product-availability-heading"
                  >
                    <h2 id="product-availability-heading" className="product-detail-section-title">
                      {fa.product.availabilityTitle}
                    </h2>
                    <ProductAvailabilityPanel availability={product.availability} />
                  </section>
                </div>

                <ProductVendorPanel product={product} />
                <ProductBundleOffersPanel
                  product={product}
                  bundles={activeBundles}
                  onAddBundleToCart={handleAddBundleToCart}
                />
                <BackInStockAlertCard product={product} />
              </aside>

              {product.introVideoUrl ? (
                <div className="product-detail-main product-detail-top-layout__details">
                  <ProductIntroVideo
                    url={product.introVideoUrl}
                    title={displayName}
                    className="product-detail-intro-video"
                  />
                </div>
              ) : null}
            </div>

            <div id="product-section-intro" />

            </div>
          </div>

          <div className="product-detail-insight-panels">
            <ProductStoneInsight product={product} className="product-detail-insight-panel" />
            <ProductArtisansPanel product={product} className="product-detail-insight-panel" />
            <ProductAuthenticityCard product={product} className="product-detail-insight-panel" />
          </div>

          <div className="product-detail-hero-meta">
            <ProductDetailTrustCards />
          </div>

          <div className="product-detail-pre-owned">
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
          <ProductComments
            productId={product.id}
            productName={product.namePersian?.trim() || product.name}
            productImage={product.images?.[0] ?? product.image}
            initialApproved={
              initialPayload?.product.id === product.id ? initialPayload.approvedComments : undefined
            }
          />
        </section>

        <section id="product-section-questions" className="product-detail-questions">
          <ProductQuestions
            productId={product.id}
            productName={product.namePersian?.trim() || product.name}
            productImage={product.images?.[0] ?? product.image}
            initialApproved={
              initialPayload?.product.id === product.id ? initialPayload.approvedQuestions : undefined
            }
          />
        </section>

        <ProductVendorProductsRail
          products={vendorProducts}
          vendorName={product.vendor?.displayName}
        />

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
