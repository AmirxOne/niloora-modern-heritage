import type { CommissionType } from "@prisma/client";

export type CommissionRuleSnapshot = {
  id: string | null;
  vendorId: string | null;
  commissionType: CommissionType;
  value: number;
  label?: string | null;
};
