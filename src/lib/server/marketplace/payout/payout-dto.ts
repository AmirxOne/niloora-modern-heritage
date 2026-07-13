import type { Payout, PayoutStatus } from "@prisma/client";

export type PayoutDto = {
  id: string;
  vendorId: string;
  userId: string;
  currency: string;
  amount: number;
  status: PayoutStatus;
  reference: string;
  failureReason: string | null;
  requestedById: string | null;
  approvedById: string | null;
  processedById: string | null;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  processingAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toPayoutDto(payout: Payout): PayoutDto {
  return {
    id: payout.id,
    vendorId: payout.vendorId,
    userId: payout.userId,
    currency: payout.currency,
    amount: Number(payout.amount),
    status: payout.status,
    reference: payout.reference,
    failureReason: payout.failureReason,
    requestedById: payout.requestedById,
    approvedById: payout.approvedById,
    processedById: payout.processedById,
    requestedAt: payout.requestedAt.toISOString(),
    approvedAt: payout.approvedAt?.toISOString() ?? null,
    rejectedAt: payout.rejectedAt?.toISOString() ?? null,
    processingAt: payout.processingAt?.toISOString() ?? null,
    completedAt: payout.completedAt?.toISOString() ?? null,
    failedAt: payout.failedAt?.toISOString() ?? null,
    createdAt: payout.createdAt.toISOString(),
    updatedAt: payout.updatedAt.toISOString(),
  };
}
