"use client";

import type { CartPricingBreakdown } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";

interface CartFuroohSummaryProps {
  pricing: CartPricingBreakdown;
  /** در checkout جمع نهایی در بلوک جداگانه نمایش داده می‌شود */
  hidePayable?: boolean;
}

export function CartFuroohSummary({ pricing, hidePayable }: CartFuroohSummaryProps) {
  if (pricing.subtotalSale === 0) return null;

  return (
    <div className="cart-furooh-summary">
      <div className="cart-furooh-summary-row">
        <span className="text-sm text-silver">{fa.cart.subtotalBeforeBahakahi}</span>
        <span className="text-sm text-silver line-through decoration-gold/30">
          {formatPrice(pricing.subtotalList)}
        </span>
      </div>

      {pricing.productFurooh > 0 ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--gain">
          <span>{fa.bahakahi.fromProducts}</span>
          <span className="discount-amount">−{formatPrice(pricing.productFurooh)}</span>
        </div>
      ) : null}

      {pricing.siteWideFurooh > 0 ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--gain">
          <span>{fa.bahakahi.siteWide(pricing.siteWidePercent)}</span>
          <span className="discount-amount">−{formatPrice(pricing.siteWideFurooh)}</span>
        </div>
      ) : null}

      {pricing.promoFurooh > 0 && pricing.appliedPromo ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--gain">
          <span>{fa.bahakahi.fromCode(pricing.appliedPromo.label)}</span>
          <span className="discount-amount">−{formatPrice(pricing.promoFurooh)}</span>
        </div>
      ) : null}

      {pricing.totalFurooh > 0 ? (
        <div className="cart-furooh-total">
          <p className="cart-furooh-total-label">{fa.bahakahi.totalBlessing}</p>
          <p className="cart-furooh-total-amount">{formatPrice(pricing.totalFurooh)}</p>
          <p className="cart-furooh-total-hint">{fa.bahakahi.blessedMessage}</p>
        </div>
      ) : null}

      {!hidePayable ? (
        <div className="cart-furooh-summary-row cart-furooh-summary-row--payable">
          <span className="font-medium text-ivory">{fa.cart.payable}</span>
          <span className="font-display text-2xl font-semibold text-gold-dark">
            {formatPrice(pricing.payable)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
