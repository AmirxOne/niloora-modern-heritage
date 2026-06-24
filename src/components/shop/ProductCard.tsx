"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { getProductPricing } from "@/lib/pricing";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { Heart } from "@/components/icons";
import { ProductCompareButton } from "@/components/product/ProductCompareButton";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn, formatTomanAmount } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/image-blur";
import { getProductDisplayName } from "@/lib/products/product-display-name";
import { displayDigits } from "@/lib/persian-digits";
import { DiscountCountdown } from "@/components/commerce/DiscountCountdown";
import { getProductCardSupplier } from "@/lib/marketplace/product-card-supplier";

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
}: ProductCardProps) {
  const displayName = displayDigits(getProductDisplayName(product));
  const supplier = getProductCardSupplier(product);
  const supplierDisplayName = displayDigits(supplier.name);
  const { wishlist } = useApp();
  const wished = wishlist.isWishlisted(product.id);
  const isSold = product.availability === "sold";
  const pricing = getProductPricing(product);
  const showTimer = timerOverride ?? pricing.hasProductFurooh;

  const overlayActions = (
    <div className="shop-product-card-overlay-actions">
      <ProductCompareButton productId={product.id} variant="card" />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          wishlist.toggle(product.id);
        }}
        className={cn("shop-product-card-wishlist", wished && "shop-product-card-wishlist--active")}
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
  );

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
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </Link>

        <div className="shop-product-card-hover-panel">
          <div className="shop-product-card-overlay-row">
            <Link href={`/product/${product.id}`} className="shop-product-card-overlay-title">
              {displayName}
            </Link>
            {overlayActions}
          </div>
        </div>

        {product.vendor ? (
          <span className="shop-product-card-vendor-badge">{fa.shop.vendorBadge(product.vendor.displayName)}</span>
        ) : null}

        {isSold ? <div className="shop-product-card-sold-veil" aria-hidden /> : null}
      </div>

      <div className={cn("shop-product-card-footer", compact && "shop-product-card-footer--compact")}>
        <div className="shop-product-card-footer-topline">
          <Link href={`/product/${product.id}`} className="shop-product-card-footer-title">
            {displayName}
          </Link>
          {!isSold && product.availability !== "ready" ? (
            <div className="shop-product-card-footer-status-badge">
              <ProductAvailabilityBadge availability={product.availability} short overlay={false} />
            </div>
          ) : null}
        </div>

        <div className="shop-product-card-footer-meta-row">
          <Link
            href={supplier.href}
            className="shop-product-card-footer-author shop-product-card-footer-vendor"
            aria-label={
              supplier.isPlatform ? fa.shop.platformGallerySupplier : fa.product.vendorViewStore
            }
          >
            <span
              className="shop-product-card-footer-avatar-wrap shop-product-card-footer-vendor-avatar"
              aria-hidden
            >
              {supplier.initial}
            </span>
            <span className="shop-product-card-footer-author-name">{supplierDisplayName}</span>
          </Link>
        </div>

        <div className="shop-product-card-footer-bottomline">
          {pricing.hasProductFurooh ? (
            <span
              className="shop-product-card-discount-tag shop-product-card-discount-tag--footer"
              aria-label={fa.bahakahi.percentOff(pricing.furoohPercent)}
            >
              {fa.bahakahi.cardTag(pricing.furoohPercent)}
            </span>
          ) : null}

          <div className="shop-product-card-footer-price">
            <div className="shop-product-card-footer-price-meta">
              {pricing.hasProductFurooh ? (
                <span className="shop-product-card-price-old">
                  {formatTomanAmount(pricing.listPrice)}
                </span>
              ) : null}
            </div>
            <span className="shop-product-card-price-main">
              <span className="shop-product-card-price-currency">تومان</span>
              <span className="shop-product-card-price-amount">
                {formatTomanAmount(pricing.salePrice)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {showTimer && !compact ? (
        <DiscountCountdown
          productId={product.id}
          endsAt={product.discountEndsAt}
          className="shop-product-card-discount-countdown"
        />
      ) : null}
    </>
  );

  const cardClassName = cn("shop-product-card group", compact && "shop-product-card--compact");

  if (variant === "carousel") {
    return (
      <article className={cardClassName} data-persian-digits="react">
        {content}
      </article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={cardClassName}
      data-persian-digits="react"
    >
      {content}
    </motion.article>
  );
}
