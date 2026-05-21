"use client";

import { useMemo } from "react";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CartPricingBreakdown } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";

interface CartCheckoutTotalsProps {
  pricing: CartPricingBreakdown;
  shippingForm: CheckoutShippingInput | null;
}

export function CartCheckoutTotals({ pricing, shippingForm }: CartCheckoutTotalsProps) {
  const quote = useMemo(() => {
    if (!shippingForm) {
      return computeShippingCost({
        province: "",
        shippingMethod: "standard",
      });
    }
    return computeShippingCost({
      province: shippingForm.province,
      city: shippingForm.city,
      shippingMethod: shippingForm.shippingMethod,
    });
  }, [shippingForm]);

  const grandTotal = pricing.payable + (quote.ready ? quote.cost : 0);

  return (
    <div className="cart-checkout-totals">
      <div className="cart-checkout-totals-row">
        <span className="text-sm text-silver">{fa.cart.itemsSubtotal}</span>
        <span className="text-sm font-medium text-ivory">{formatPrice(pricing.payable)}</span>
      </div>

      <div className="cart-checkout-totals-row">
        <span className="text-sm text-silver">{fa.cart.shippingCostLabel}</span>
        {quote.ready ? (
          <span className="text-sm font-medium text-ivory">
            {quote.cost > 0 ? formatPrice(quote.cost) : fa.dashboard.orderShippingCostFree}
          </span>
        ) : (
          <span className="text-xs text-silver">{fa.cart.shippingCostPending}</span>
        )}
      </div>

      {quote.ready && quote.zoneLabel ? (
        <p className="cart-checkout-totals-zone">{fa.cart.shippingZoneHint(quote.zoneLabel)}</p>
      ) : null}

      <div className="cart-checkout-totals-row cart-checkout-totals-row--grand">
        <span className="font-medium text-ivory">{fa.cart.grandTotal}</span>
        <span className="font-display text-2xl font-semibold text-gold-dark">
          {formatPrice(grandTotal)}
        </span>
      </div>
    </div>
  );
}

export function useCheckoutGrandTotal(
  pricing: CartPricingBreakdown,
  shippingForm: CheckoutShippingInput | null
): { grandTotal: number; quote: ReturnType<typeof computeShippingCost> } {
  const quote = useMemo(() => {
    if (!shippingForm) {
      return computeShippingCost({ province: "", shippingMethod: "standard" });
    }
    return computeShippingCost({
      province: shippingForm.province,
      city: shippingForm.city,
      shippingMethod: shippingForm.shippingMethod,
    });
  }, [shippingForm]);

  const grandTotal = pricing.payable + (quote.ready ? quote.cost : 0);
  return { grandTotal, quote };
}
