"use client";

import { Crown, Sparkles } from "@/components/icons";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { fa } from "@/lib/i18n/fa";
import type { LoyaltySummary } from "@/lib/types";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";

const tierClassById: Record<LoyaltySummary["tier"], string> = {
  bronze: "loyalty-tier loyalty-tier--bronze",
  silver: "loyalty-tier loyalty-tier--silver",
  gold: "loyalty-tier loyalty-tier--gold",
  platinum: "loyalty-tier loyalty-tier--platinum",
};

export function AccountLoyaltyClubCard({ loyalty }: { loyalty: LoyaltySummary }) {
  return (
    <section className="account-loyalty-card">
      <header className="account-loyalty-head">
        <p className="account-loyalty-eyebrow">{fa.loyalty.title}</p>
        <span className={tierClassById[loyalty.tier]}>
          <Crown size={iconSizes.xs} variant={ICON_VARIANT} />
          {fa.loyalty.tierLabel[loyalty.tier]}
        </span>
      </header>

      <div className="account-loyalty-grid">
        <div className="account-loyalty-kpi">
          <span>{fa.loyalty.pointsLabel}</span>
          <strong>{loyalty.points.toLocaleString("fa-IR")}</strong>
        </div>
        <div className="account-loyalty-kpi">
          <span>{fa.loyalty.checkoutBenefitLabel}</span>
          <strong>{fa.loyalty.discountPercent(loyalty.tierDiscountPercent)}</strong>
        </div>
      </div>

      <p className="account-loyalty-spend">
        {fa.loyalty.lifetimeSpendLabel}: <TomanPrice amount={loyalty.lifetimeSpend} size="xs" />
      </p>

      {loyalty.nextTier && loyalty.amountToNextTier != null ? (
        <p className="account-loyalty-next">
          <Sparkles size={iconSizes.xs} variant={ICON_VARIANT} />
          {fa.loyalty.nextTierHint(
            fa.loyalty.tierLabel[loyalty.nextTier],
            loyalty.amountToNextTier.toLocaleString("fa-IR")
          )}
        </p>
      ) : (
        <p className="account-loyalty-next">{fa.loyalty.maxTierHint}</p>
      )}

      <ul className="account-loyalty-perks">
        {loyalty.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>
    </section>
  );
}
