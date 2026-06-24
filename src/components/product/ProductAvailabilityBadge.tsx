"use client";

import { Crown, History, PenTool } from "@/components/icons";
import { getProductStatusConfig, type ProductStatusTone } from "@/lib/product-status";
import { ICON_VARIANT, iconSizes, type IconComponent } from "@/lib/icons";
import type { ProductAvailability } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneClasses: Record<ProductStatusTone, string> = {
  ready: "product-status--ready",
  wait: "product-status--wait",
  sold: "product-status--sold",
  luxury: "product-status--luxury",
  custom: "product-status--custom",
};

const overlayIcons: Partial<Record<ProductStatusTone, IconComponent>> = {
  luxury: Crown,
  wait: History,
  custom: PenTool,
};

interface ProductAvailabilityBadgeProps {
  availability: ProductAvailability;
  size?: "sm" | "md";
  showDelivery?: boolean;
  /** برچسب کوتاه برای کارت گالری */
  short?: boolean;
  /** استایل شیشه‌ای روی تصویر؛ برای فوتر کارت false بگذارید */
  overlay?: boolean;
  className?: string;
}

export function ProductAvailabilityBadge({
  availability,
  size = "sm",
  showDelivery = false,
  short = false,
  overlay = true,
  className,
}: ProductAvailabilityBadgeProps) {
  const config = getProductStatusConfig(availability);
  const tooltipText = `${config.description} — ${config.deliveryHint}`;
  const OverlayIcon = short && overlay ? overlayIcons[config.tone] : null;

  return (
    <div className={cn("product-status-wrap", className)}>
      <span
        className={cn(
          "product-status-badge",
          toneClasses[config.tone],
          size === "md" && "product-status-badge--md",
          short && "product-status-badge--sm",
          overlay && "product-status-badge--overlay"
        )}
        title={tooltipText}
      >
        {OverlayIcon ? (
          <OverlayIcon
            size={iconSizes.xs}
            variant={ICON_VARIANT}
            className="product-status-badge__icon"
            aria-hidden
          />
        ) : null}
        <span className="product-status-badge__text">
          {short ? config.shortLabel : config.label}
        </span>
      </span>
      {showDelivery ? <p className="product-status-delivery">{config.deliveryHint}</p> : null}
    </div>
  );
}
