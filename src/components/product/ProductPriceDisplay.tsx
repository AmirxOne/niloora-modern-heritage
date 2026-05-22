"use client";

import type { Product } from "@/lib/types";
import { getProductPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { StackedTomanPrice, TomanPrice, TomanPriceWithSuffix } from "@/components/commerce/TomanPrice";

interface ProductPriceDisplayProps {
  product: Pick<Product, "price" | "listPrice" | "discountPercent">;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
  /** برچسب فشردهٔ درصد بهاکاهی کنار قیمت (کارت محصول) */
  showBahakahiPercent?: boolean;
  /** چیدمان عمودی: قیمت قبلی بالا (بدون تومان)، قیمت جدید پایین */
  layout?: "inline" | "stack";
}

export function ProductPriceDisplay({
  product,
  size = "md",
  className,
  showBadge = true,
  showBahakahiPercent = false,
  layout = "inline",
}: ProductPriceDisplayProps) {
  const pricing = getProductPricing(product);
  const isStack = layout === "stack";

  return (
    <div className={cn("product-price-display", isStack && "product-price-display--stack", className)}>
      <div
        className={cn(
          isStack ? "product-price-display-stack-wrap" : "flex flex-wrap items-baseline gap-x-2 gap-y-1"
        )}
      >
        {isStack ? (
          <StackedTomanPrice
            listPrice={pricing.listPrice}
            salePrice={pricing.salePrice}
            size={size}
            hasListPrice={pricing.hasProductFurooh}
          />
        ) : (
          <>
            {pricing.hasProductFurooh ? (
              <TomanPrice amount={pricing.listPrice} size={size} variant="list" />
            ) : null}
            <TomanPrice amount={pricing.salePrice} size={size} />
          </>
        )}
        {!isStack && pricing.hasProductFurooh && showBahakahiPercent ? (
          <span className="product-price-bahakahi-pill">
            {fa.bahakahi.percentOff(pricing.furoohPercent)}
          </span>
        ) : null}
      </div>
      {pricing.hasProductFurooh && showBadge ? (
        <p className="product-price-discount-row mt-5 text-xs discount-text">
          <span className="furooh-badge shrink-0">{fa.bahakahi.percentOff(pricing.furoohPercent)}</span>
          <TomanPriceWithSuffix
            amount={pricing.productFurooh}
            suffix={fa.bahakahi.productSavedSuffix}
            size="xs"
          />
        </p>
      ) : null}
    </div>
  );
}
