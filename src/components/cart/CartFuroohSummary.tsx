"use client";

import type { CartPricingBreakdown } from "@/lib/pricing";
import { fa } from "@/lib/i18n/fa";
import { TomanPrice } from "@/components/commerce/TomanPrice";

interface CartFuroohSummaryProps {
  pricing: CartPricingBreakdown;
  /** در checkout جمع نهایی در بلوک جداگانه نمایش داده می‌شود */
  hidePayable?: boolean;
}

function DiscountAmount({ amount }: { amount: number }) {
  return (
    <span className="discount-amount inline-flex items-baseline gap-x-0.5">
      <span aria-hidden>−</span>
      <TomanPrice amount={amount} size="xs" />
    </span>
  );
}

export function CartFuroohSummary({ pricing, hidePayable }: CartFuroohSummaryProps) {
  if (pricing.subtotalSale === 0) return null;

  return (
    <div className="cart-furooh-summary">
      <div className="cart-furooh-summary-row">
        <span className="text-sm text-silver">{fa.cart.subtotalBeforeBahakahi}</span>
        <TomanPrice amount={pricing.subtotalList} size="xs" variant="list" />
      </div>

      {pricing.productFurooh > 0 ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--gain">
          <span>{fa.bahakahi.fromProducts}</span>
          <DiscountAmount amount={pricing.productFurooh} />
        </div>
      ) : null}

      {pricing.siteWideFurooh > 0 ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--gain">
          <span>{fa.bahakahi.siteWide(pricing.siteWidePercent)}</span>
          <DiscountAmount amount={pricing.siteWideFurooh} />
        </div>
      ) : null}

      {pricing.promoFurooh > 0 && pricing.appliedPromo ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--gain">
          <span>{fa.bahakahi.fromCode(pricing.appliedPromo.label)}</span>
          <DiscountAmount amount={pricing.promoFurooh} />
        </div>
      ) : null}

      {pricing.totalFurooh > 0 ? (
        <div className="cart-furooh-total">
          <p className="cart-furooh-total-label">{fa.bahakahi.totalBlessing}</p>
          <p className="cart-furooh-total-amount">
            <TomanPrice amount={pricing.totalFurooh} size="md" />
          </p>
          <p className="cart-furooh-total-hint">{fa.bahakahi.blessedMessage}</p>
        </div>
      ) : null}

      {!hidePayable ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--payable">
          <span className="font-medium text-ivory">{fa.cart.payable}</span>
          <TomanPrice amount={pricing.payable} size="md" />
        </div>
      ) : null}
    </div>
  );
}
