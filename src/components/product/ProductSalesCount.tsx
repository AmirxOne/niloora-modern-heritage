"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { selectProductSalesCount } from "@/lib/store/slices/productSalesSlice";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

interface ProductSalesCountProps {
  productId: string;
  className?: string;
  variant?: "default" | "subtle";
}

export function ProductSalesCount({
  productId,
  className,
  variant = "default",
}: ProductSalesCountProps) {
  const count = useAppSelector(selectProductSalesCount(productId));

  if (count <= 0) return null;

  return (
    <p
      className={cn(
        "product-sales-count",
        variant === "subtle" && "product-sales-count--subtle",
        className
      )}
      aria-label={fa.product.salesBlessedAria(count)}
    >
      <span className="product-sales-count-icon" aria-hidden>
        ✦
      </span>
      {fa.product.salesBlessed(count)}
    </p>
  );
}
