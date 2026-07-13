import type { Refund, RefundStatus, RefundType } from "@prisma/client";

export type RefundDto = {
  id: string;
  orderId: string;
  orderReturnId: string | null;
  userId: string;
  currency: string;
  amount: number;
  type: RefundType;
  status: RefundStatus;
  reason: string | null;
  reference: string;
  failureReason: string | null;
  requestedById: string | null;
  reviewedById: string | null;
  approvedById: string | null;
  processedById: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  processingAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toRefundDto(refund: Refund): RefundDto {
  return {
    id: refund.id,
    orderId: refund.orderId,
    orderReturnId: refund.orderReturnId,
    userId: refund.userId,
    currency: refund.currency,
    amount: Number(refund.amount),
    type: refund.type,
    status: refund.status,
    reason: refund.reason,
    reference: refund.reference,
    failureReason: refund.failureReason,
    requestedById: refund.requestedById,
    reviewedById: refund.reviewedById,
    approvedById: refund.approvedById,
    processedById: refund.processedById,
    requestedAt: refund.requestedAt.toISOString(),
    reviewedAt: refund.reviewedAt?.toISOString() ?? null,
    approvedAt: refund.approvedAt?.toISOString() ?? null,
    rejectedAt: refund.rejectedAt?.toISOString() ?? null,
    processingAt: refund.processingAt?.toISOString() ?? null,
    completedAt: refund.completedAt?.toISOString() ?? null,
    failedAt: refund.failedAt?.toISOString() ?? null,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
  };
}
