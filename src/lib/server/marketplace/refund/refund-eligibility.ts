import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { PAYMENT_STATUS } from "@/lib/server/commerce/statuses";
import { RefundAmountError, RefundIneligibleError } from "@/lib/server/marketplace/refund/refund-errors";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** Refund amounts already committed to an order (anything not rejected/failed). */
const COMMITTED_REFUND_STATUSES = [
  "requested",
  "under_review",
  "approved",
  "processing",
  "completed",
] as const;

export type RefundEligibleOrder = {
  id: string;
  total: number;
  finalizedAt: Date | null;
  paymentStatus: string | null;
};

/**
 * Sums refund amounts already committed against an order so a new refund can
 * never exceed the remaining refundable balance (prevents over/duplicate
 * refunds). Excludes an in-progress refund by id when re-checking.
 */
export async function getCommittedRefundAmount(
  tx: PrismaTx,
  orderId: string,
  excludeRefundId?: string
): Promise<number> {
  const agg = await tx.refund.aggregate({
    where: {
      orderId,
      status: { in: [...COMMITTED_REFUND_STATUSES] },
      ...(excludeRefundId ? { id: { not: excludeRefundId } } : {}),
    },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

export async function loadRefundEligibleOrder(
  tx: PrismaTx,
  orderId: string
): Promise<RefundEligibleOrder | null> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      total: true,
      finalizedAt: true,
      payment: { select: { status: true } },
    },
  });
  if (!order) return null;
  return {
    id: order.id,
    total: order.total,
    finalizedAt: order.finalizedAt,
    paymentStatus: order.payment?.status ?? null,
  };
}

export type RefundEligibility = {
  remaining: number;
  isFull: boolean;
};

/**
 * Validates that an order can be refunded for `amount`:
 *   - order is finalized (payment captured)
 *   - payment is in a paid state
 *   - amount is a positive integer within the remaining refundable balance
 */
export function assertRefundEligible(
  order: RefundEligibleOrder,
  amount: number,
  committedAmount: number
): RefundEligibility {
  if (!order.finalizedAt) {
    throw new RefundIneligibleError("سفارش هنوز نهایی نشده است.");
  }
  if (order.paymentStatus !== PAYMENT_STATUS.paid) {
    throw new RefundIneligibleError("پرداخت سفارش تأیید نشده است.");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new RefundAmountError();
  }

  const remaining = order.total - committedAmount;
  if (remaining <= 0) {
    throw new RefundIneligibleError("این سفارش قبلاً به‌طور کامل بازپرداخت شده است.");
  }
  if (amount > remaining) {
    throw new RefundAmountError("مبلغ بازپرداخت از باقی‌ماندهٔ قابل بازگشت بیشتر است.");
  }

  return { remaining, isFull: amount === order.total && committedAmount === 0 };
}
