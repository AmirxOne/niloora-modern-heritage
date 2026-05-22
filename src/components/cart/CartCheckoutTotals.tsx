"use client";

import { useMemo } from "react";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CartPricingBreakdown } from "@/lib/pricing";
import { TomanPrice } from "@/components/commerce/TomanPrice";
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
        <TomanPrice amount={pricing.payable} size="xs" />
      </div>

      <div className="cart-checkout-totals-row">
        <span className="text-sm text-silver">{fa.cart.shippingCostLabel}</span>
        {quote.ready ? (
          <span className="text-sm font-medium text-ivory">
            {quote.cost > 0 ? <TomanPrice amount={quote.cost} size="xs" /> : fa.dashboard.orderShippingCostFree}
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
        <TomanPrice amount={grandTotal} size="md" />
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
