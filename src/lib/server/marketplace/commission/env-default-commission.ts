import type { CommissionRuleSnapshot } from "@/lib/server/marketplace/commission/types";

const DEFAULT_BPS = 1000;

export function getEnvDefaultCommissionRule(): CommissionRuleSnapshot {
  const raw = process.env.VENDOR_DEFAULT_COMMISSION_BPS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_BPS;
  const value = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_BPS;

  return {
    id: null,
    vendorId: null,
    commissionType: "percentage",
    value,
  };
}
