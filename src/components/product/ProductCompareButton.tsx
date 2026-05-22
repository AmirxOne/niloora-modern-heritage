"use client";

import { Compare } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Variant = "card" | "detail" | "inline";

export function ProductCompareButton({
  productId,
  variant = "inline",
  className,
}: {
  productId: string;
  variant?: Variant;
  className?: string;
}) {
  const { compareList } = useApp();
  const active = compareList.isInCompare(productId);

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          compareList.toggle(productId);
        }}
        className={cn(
          "shop-product-card-compare",
          active && "shop-product-card-compare--active",
          className
        )}
        aria-label={active ? fa.product.compareRemoveAria : fa.product.compareAddAria}
        aria-pressed={active}
      >
        <Compare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
      </button>
    );
  }

  if (variant === "detail") {
    return (
      <Button
        variant="outline"
        size="lg"
        type="button"
        onClick={() => compareList.toggle(productId)}
        className={cn(
          "product-detail-actions-compare product-detail-actions-btn",
          active && "product-detail-actions-compare--active",
          className
        )}
        aria-pressed={active}
      >
        <Compare size={iconSizes.sm} variant={ICON_VARIANT} className="shrink-0" aria-hidden />
        <span>{active ? fa.product.compared : fa.product.compare}</span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => compareList.toggle(productId)}
      className={cn("product-compare-btn", active && "product-compare-btn--active", className)}
      aria-pressed={active}
      aria-label={active ? fa.product.compareRemoveAria : fa.product.compareAddAria}
    >
      <Compare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
    </button>
  );
}
