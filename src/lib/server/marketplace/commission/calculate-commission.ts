import type { CommissionRuleSnapshot } from "@/lib/server/marketplace/commission/types";

export function calculateCommission(
  grossAmount: number,
  rule: CommissionRuleSnapshot,
  quantity = 1
): { commissionAmount: number; netAmount: number } {
  const gross = Math.max(0, Math.trunc(grossAmount));
  const qty = Math.max(0, Math.trunc(quantity));

  let commissionAmount: number;
  if (rule.commissionType === "percentage") {
    commissionAmount = Math.floor((gross * rule.value) / 10000);
  } else {
    commissionAmount = rule.value * qty;
  }

  commissionAmount = Math.min(Math.max(0, commissionAmount), gross);
  const netAmount = gross - commissionAmount;

  return { commissionAmount, netAmount };
}
