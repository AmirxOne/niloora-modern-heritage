"use client";

import type { Product } from "@/lib/types";
import { getProductPricing } from "@/lib/pricing";
import { formatPrice, cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";

interface ProductPriceDisplayProps {
  product: Pick<Product, "price" | "listPrice" | "discountPercent">;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
  /** برچسب فشردهٔ درصد بهاکاهی کنار قیمت (کارت محصول) */
  showBahakahiPercent?: boolean;
}

const sizeClasses = {
  sm: { sale: "text-lg", list: "text-sm" },
  md: { sale: "text-2xl", list: "text-base" },
  lg: { sale: "text-3xl", list: "text-xl" },
};

export function ProductPriceDisplay({
  product,
  size = "md",
  className,
  showBadge = true,
  showBahakahiPercent = false,
}: ProductPriceDisplayProps) {
  const pricing = getProductPricing(product);
  const sizes = sizeClasses[size];

  return (
    <div className={cn("product-price-display", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={cn("font-display font-semibold text-gold-dark", sizes.sale)}>
          {formatPrice(pricing.salePrice)}
        </span>
        {pricing.hasProductFurooh ? (
          <span className={cn("text-silver line-through decoration-gold/40", sizes.list)}>
            {formatPrice(pricing.listPrice)}
          </span>
        ) : null}
        {pricing.hasProductFurooh && showBahakahiPercent ? (
          <span className="product-price-bahakahi-pill">
            {fa.bahakahi.percentOff(pricing.furoohPercent)}
          </span>
        ) : null}
      </div>
      {pricing.hasProductFurooh && showBadge ? (
        <p className="mt-2 text-xs discount-text">
          <span className="furooh-badge">{fa.bahakahi.percentOff(pricing.furoohPercent)}</span>
          <span className="mx-2 text-gold/30">·</span>
          {fa.bahakahi.productSaved(formatPrice(pricing.productFurooh))}
        </p>
      ) : null}
    </div>
  );
}
