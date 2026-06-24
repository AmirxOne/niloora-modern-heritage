import type { Prisma, PrismaClient } from "@prisma/client";
import { getEnvDefaultCommissionRule } from "@/lib/server/marketplace/commission/env-default-commission";
import type { CommissionRuleSnapshot } from "@/lib/server/marketplace/commission/types";

type PrismaDb = Prisma.TransactionClient | PrismaClient;

function toSnapshot(
  rule: {
    id: string;
    vendorId: string | null;
    commissionType: CommissionRuleSnapshot["commissionType"];
    value: number;
    label: string | null;
  }
): CommissionRuleSnapshot {
  return {
    id: rule.id,
    vendorId: rule.vendorId,
    commissionType: rule.commissionType,
    value: rule.value,
    label: rule.label,
  };
}

async function findActiveRule(
  db: PrismaDb,
  vendorId: string | null,
  eventTime: Date
) {
  return db.vendorCommissionRule.findFirst({
    where: {
      vendorId,
      effectiveFrom: { lte: eventTime },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: eventTime } }],
    },
    orderBy: { effectiveFrom: "desc" },
    select: {
      id: true,
      vendorId: true,
      commissionType: true,
      value: true,
      label: true,
    },
  });
}

export async function resolveCommissionRule(
  db: PrismaDb,
  vendorId: string,
  eventTime: Date
): Promise<CommissionRuleSnapshot> {
  const vendorRule = await findActiveRule(db, vendorId, eventTime);
  if (vendorRule) {
    return toSnapshot(vendorRule);
  }

  const platformRule = await findActiveRule(db, null, eventTime);
  if (platformRule) {
    return toSnapshot(platformRule);
  }

  return getEnvDefaultCommissionRule();
}
