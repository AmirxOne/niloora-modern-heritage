"use client";

import type { ProductAvailability } from "@/lib/types";
import { getProductStatusConfig } from "@/lib/product-status";
import { cn } from "@/lib/utils";

const toneClasses: Record<string, string> = {
  ready: "product-status--ready",
  wait: "product-status--wait",
  sold: "product-status--sold",
  luxury: "product-status--luxury",
  custom: "product-status--custom",
};

interface ProductAvailabilityBadgeProps {
  availability: ProductAvailability;
  size?: "sm" | "md";
  showDelivery?: boolean;
  /** برچسب کوتاه برای کارت گالری */
  short?: boolean;
  className?: string;
}

export function ProductAvailabilityBadge({
  availability,
  size = "sm",
  showDelivery = false,
  short = false,
  className,
}: ProductAvailabilityBadgeProps) {
  const config = getProductStatusConfig(availability);
  const tooltipText = `${config.description} — ${config.deliveryHint}`;

  return (
    <div className={cn("product-status-wrap", className)}>
      <span
        className={cn(
          "product-status-badge",
          toneClasses[config.tone],
          size === "md" && "product-status-badge--md",
          short && "product-status-badge--sm"
        )}
        title={tooltipText}
      >
        {short ? config.shortLabel : config.label}
      </span>
      {showDelivery ? <p className="product-status-delivery">{config.deliveryHint}</p> : null}
    </div>
  );
}
