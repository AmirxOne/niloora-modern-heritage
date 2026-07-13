import type { Settlement, SettlementStatus } from "@prisma/client";

export type SettlementDto = {
  id: string;
  orderId: string;
  vendorId: string;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: SettlementStatus;
  eligibleAt: string;
  settledAt: string | null;
  paidOutAt: string | null;
  reversedAt: string | null;
  createdAt: string;
};

export function toSettlementDto(row: Settlement): SettlementDto {
  return {
    id: row.id,
    orderId: row.orderId,
    vendorId: row.vendorId,
    currency: row.currency,
    grossAmount: Number(row.grossAmount),
    commissionAmount: Number(row.commissionAmount),
    netAmount: Number(row.netAmount),
    status: row.status,
    eligibleAt: row.eligibleAt.toISOString(),
    settledAt: row.settledAt?.toISOString() ?? null,
    paidOutAt: row.paidOutAt?.toISOString() ?? null,
    reversedAt: row.reversedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
