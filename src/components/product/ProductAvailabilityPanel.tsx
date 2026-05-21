"use client";

import type { ProductAvailability } from "@/lib/types";
import { getProductStatusConfig, isImmediateDelivery } from "@/lib/product-status";
import { fa } from "@/lib/i18n/fa";
import { ProductAvailabilityBadge } from "./ProductAvailabilityBadge";

interface ProductAvailabilityPanelProps {
  availability: ProductAvailability;
}

export function ProductAvailabilityPanel({ availability }: ProductAvailabilityPanelProps) {
  const config = getProductStatusConfig(availability);
  const immediate = isImmediateDelivery(availability);

  return (
    <div className="product-availability-panel" role="status">
      <ProductAvailabilityBadge availability={availability} size="md" />
      <p className="mt-3 text-sm leading-relaxed text-silver">{config.description}</p>
      <div className="product-availability-delivery-row">
        <span className="product-availability-delivery-icon" aria-hidden>
          {immediate ? "◆" : "◇"}
        </span>
        <div>
          <p className="text-xs font-medium text-ivory">{fa.productStatus.deliveryTitle}</p>
          <p className="mt-0.5 text-sm text-turquoise-dark">{config.deliveryHint}</p>
        </div>
      </div>
      {!immediate ? (
        <p className="mt-3 text-xs leading-relaxed text-silver/80">{fa.productStatus.waitNote}</p>
      ) : null}
    </div>
  );
}
