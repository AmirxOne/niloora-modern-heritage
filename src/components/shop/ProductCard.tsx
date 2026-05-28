"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { getProductPricing } from "@/lib/pricing";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { Heart, Share, Gem, PenTool, Category, Sparkles } from "@/components/icons";
import { ProductCompareButton } from "@/components/product/ProductCompareButton";
import { PreOwnedBadge } from "@/components/pre-owned/PreOwnedBadge";
import { isPreOwnedProduct } from "@/lib/pre-owned";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn, formatTomanAmount } from "@/lib/utils";
import { DiscountCountdown } from "@/components/commerce/DiscountCountdown";
import { ENGRAVING_STYLES, METAL_OPTIONS, STONE_OPTIONS } from "@/lib/constants";

interface ProductCardProps {
  product: Product;
  index?: number;
  /** داخل اسلایدر افقی — بدون انیمیشن ورود */
  variant?: "grid" | "carousel";
  timerOverride?: boolean;
  compact?: boolean;
  abTest?: {
    experimentId: string;
    variantId: string;
    identity: string;
    page: string;
  };
}

export function ProductCard({
  product,
  index = 0,
  variant = "grid",
  timerOverride,
  compact = false,
  abTest,
}: ProductCardProps) {
  const displayName = product.namePersian?.trim() || product.name;
  const listingDetails = product.listing?.details ?? [];
  const styleLabels: Record<Product["category"], string> = {
    solitaire: fa.shop.styles.solitaire,
    halo: fa.shop.styles.halo,
    vintage: fa.shop.styles.vintage,
    signet: fa.shop.styles.signet,
    eternity: fa.shop.styles.eternity,
    stackable: fa.shop.styles.stackable,
  };
  const metalLabelByValue = new Map(METAL_OPTIONS.map((item) => [item.value, item.label]));
  const stoneLabelByValue = new Map(STONE_OPTIONS.map((item) => [item.value, item.label]));
  const engravingLabelByValue = new Map(ENGRAVING_STYLES.map((item) => [item.value, item.label]));
  const { wishlist } = useApp();
  const wished = wishlist.isWishlisted(product.id);
  const isSold = product.availability === "sold";
  const pricing = getProductPricing(product);
  const showTimer = timerOverride ?? pricing.hasProductFurooh;
  const getDetailValue = (label: string): string | undefined => {
    const row = listingDetails.find((item) => new RegExp(`^${label}\\s*:`).test(item.trim()));
    if (!row) return undefined;
    return row.replace(new RegExp(`^${label}\\s*:\\s*`), "").trim() || undefined;
  };
  const detailStone = getDetailValue("نگین");
  const detailMetal = getDetailValue("جنس");
  const detailShankMaker = getDetailValue("رکاب");
  const detailEngraver = getDetailValue("حکاک");
  const detailCategory = getDetailValue("دسته");
  const detailSize = getDetailValue("سایز");

  const attributes: Array<{ key: string; label: string; value?: string; icon: JSX.Element }> = [
    {
      key: "shank-maker",
      label: "ساخت رکاب",
      value: detailShankMaker ?? product.craftedBy,
      icon: <Category size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      key: "engraver",
      label: "حکاکی رکاب",
      value: detailEngraver ?? (product.engravingType === "none" ? undefined : engravingLabelByValue.get(product.engravingType)),
      icon: <PenTool size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      key: "stone",
      label: "نگین",
      value: detailStone ?? product.stoneColorLabel ?? stoneLabelByValue.get(product.stone),
      icon: <Sparkles size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      key: "metal",
      label: "جنس",
      value: detailMetal ?? metalLabelByValue.get(product.metal),
      icon: <Gem size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      key: "size",
      label: "سایز",
      value: detailSize ?? (product.ringSize ? String(product.ringSize) : undefined),
      icon: <Category size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
    {
      key: "style",
      label: "سبک",
      value: detailCategory ?? styleLabels[product.category],
      icon: <Category size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />,
    },
  ]
    .filter((item) => Boolean(item.value))
    .slice(0, 4);

  const content = (
    <>
      <div className="shop-product-card-thumbnail-stack">
        <Link
          href={`/product/${product.id}`}
          className="shop-product-card-image-link"
          aria-label={displayName}
        >
          <Image
            src={product.image}
            alt={displayName}
            fill
            className="shop-product-card-thumb"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
        <div className="shop-product-card-toolbar shop-product-card-floating-actions">
          <ProductCompareButton productId={product.id} variant="card" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window !== "undefined") {
                void navigator.clipboard?.writeText(`${window.location.origin}/product/${product.id}`);
              }
            }}
            className="shop-product-card-share"
            aria-label="اشتراک‌گذاری محصول"
            title="اشتراک‌گذاری محصول"
          >
            <Share size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              wishlist.toggle(product.id);
            }}
            className={cn(
              "shop-product-card-wishlist",
              wished && "shop-product-card-wishlist--active"
            )}
            aria-label={wished ? fa.product.wishlistRemoveAria : fa.product.wishlistAddAria}
            aria-pressed={wished}
          >
            <Heart
              className="shop-product-card-wishlist-icon"
              fill={wished ? "currentColor" : "none"}
              size={iconSizes.sm}
              variant={ICON_VARIANT}
              aria-hidden
            />
          </button>
        </div>
        {isSold ? <div className="shop-product-card-sold-veil" aria-hidden /> : null}
      </div>

      <div className={cn("shop-product-card-body", compact && "shop-product-card-body--compact")}>
        <div className="shop-product-card-heading-row">
          <Link href={`/product/${product.id}`} className="shop-product-card-title-link" title={displayName}>
            <h3 className="shop-product-card-title">{displayName}</h3>
          </Link>
        </div>

        <dl className="shop-product-card-attributes" aria-label="ویژگی‌های محصول">
          {attributes.map((item) => (
            <div key={item.key} className="shop-product-card-attribute-item">
              <dt className="shop-product-card-attribute-label">
                <span className="shop-product-card-attribute-icon">{item.icon}</span>
                <span className="sr-only">{item.label}</span>
              </dt>
              <dd className="shop-product-card-attribute-value">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="shop-product-card-meta-row">
          <div className="shop-product-card-status">
            {isPreOwnedProduct(product) ? <PreOwnedBadge /> : null}
            <ProductAvailabilityBadge availability={product.availability} short />
          </div>
        </div>

        <div className={cn("shop-product-card-pricing-row", compact && "shop-product-card-pricing-row--compact")}>
          {pricing.hasProductFurooh ? (
            <span
              className="shop-product-card-discount-tag"
              aria-label={fa.bahakahi.percentOff(pricing.furoohPercent)}
            >
              {fa.bahakahi.cardTag(pricing.furoohPercent)}
            </span>
          ) : null}
          <div className="shop-product-card-pricing-values">
            {pricing.hasProductFurooh ? (
              <p className="shop-product-card-price-old">
                <span className="shop-product-card-price-old-amount">{formatTomanAmount(pricing.listPrice)}</span>
              </p>
            ) : null}
            <p className="shop-product-card-price-main">
              <span className="shop-product-card-price-currency">تومان</span>
              <span className="shop-product-card-price-amount">
                {formatTomanAmount(pricing.salePrice)}
              </span>
            </p>
          </div>
        </div>
        {showTimer && !compact ? (
          <DiscountCountdown
            productId={product.id}
            endsAt={product.discountEndsAt}
            className="shop-product-card-discount-countdown"
          />
        ) : null}
      </div>
    </>
  );

  if (variant === "carousel") {
    return <article className="shop-product-card group">{content}</article>;
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="shop-product-card group"
    >
      {content}
    </motion.article>
  );
}
