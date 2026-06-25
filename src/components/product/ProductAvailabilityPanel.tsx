"use client";

import type { ProductAvailability } from "@/lib/types";
import { getProductStatusConfig, isImmediateDelivery } from "@/lib/product-status";
import { fa } from "@/lib/i18n/fa";
import { getMinStandardShippingCost } from "@/lib/orders/shipping-cost";
import { formatTomanAmount } from "@/lib/utils";

interface ProductAvailabilityPanelProps {
  availability: ProductAvailability;
}

export function ProductAvailabilityPanel({ availability }: ProductAvailabilityPanelProps) {
  const config = getProductStatusConfig(availability);
  const immediate = isImmediateDelivery(availability);
  const minShipping = getMinStandardShippingCost();

  return (
    <div className="product-availability-panel" role="status">
      <div className="product-availability-delivery-row">
        <span className="product-availability-delivery-icon" aria-hidden>
          {immediate ? "◆" : "◇"}
        </span>
        <div>
          <p className="text-xs font-medium text-ivory">{fa.productStatus.deliveryTitle}</p>
          <p className="mt-0.5 text-sm text-turquoise-dark">{config.deliveryHint}</p>
        </div>
      </div>
      <div className="product-availability-delivery-row" data-persian-digits="react">
        <span className="product-availability-delivery-icon" aria-hidden>
          ☖
        </span>
        <div>
          <p className="text-xs font-medium text-ivory">{fa.productStatus.shippingTitle}</p>
          <p className="mt-0.5 text-sm text-turquoise-dark">
            {fa.productStatus.shippingFromHint(formatTomanAmount(minShipping))}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-silver/80">
            {fa.productStatus.shippingCalcNote}
          </p>
        </div>
      </div>
      {!immediate ? (
        <p className="mt-3 text-xs leading-relaxed text-silver/80">{fa.productStatus.waitNote}</p>
      ) : null}
    </div>
  );
}
