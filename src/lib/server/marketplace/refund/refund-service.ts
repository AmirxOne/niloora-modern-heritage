import { randomUUID } from "node:crypto";
import type { PrismaClient, Refund, RefundStatus, RefundType } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  MARKETPLACE_EVENTS,
  publishDomainEvent,
} from "@/lib/server/marketplace/events/domain-events";
import {
  assertRefundTransition,
  RefundTransitionError,
} from "@/lib/server/marketplace/refund/refund-state-machine";
import {
  RefundConflictError,
  RefundError,
  RefundIneligibleError,
  RefundNotFoundError,
} from "@/lib/server/marketplace/refund/refund-errors";
import {
  assertRefundEligible,
  getCommittedRefundAmount,
} from "@/lib/server/marketplace/refund/refund-eligibility";
import { reverseSettlementsForRefund } from "@/lib/server/marketplace/refund/settlement-reversal";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export {
  RefundError,
  RefundNotFoundError,
  RefundIneligibleError,
  RefundConflictError,
  RefundTransitionError,
};

async function recordHistory(
  tx: PrismaTx,
  refundId: string,
  fromStatus: RefundStatus | null,
  toStatus: RefundStatus,
  changedById: string | null,
  note?: string | null
): Promise<void> {
  await tx.refundStatusHistory.create({
    data: { refundId, fromStatus, toStatus, changedById: changedById ?? null, note: note ?? null },
  });
}

export type RequestRefundInput = {
  orderId: string;
  amount: number;
  type?: RefundType;
  reason?: string | null;
  /** Client idempotency key preventing duplicate refund requests. */
  reference: string;
  orderReturnId?: string | null;
  requestedById?: string | null;
  currency?: string;
};

export type RequestRefundResult = {
  refund: Refund;
  deduped: boolean;
};

export async function requestRefund(input: RequestRefundInput): Promise<RequestRefundResult> {
  const currency = input.currency?.trim() || "IRR";

  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;

    const existing = await tx.refund.findUnique({ where: { reference: input.reference } });
    if (existing) return { refund: existing, deduped: true };

    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        finalizedAt: true,
        payment: { select: { status: true } },
      },
    });
    if (!order) throw new RefundIneligibleError("سفارش یافت نشد.");

    const committed = await getCommittedRefundAmount(tx, order.id);
    const eligibility = assertRefundEligible(
      {
        id: order.id,
        total: order.total,
        finalizedAt: order.finalizedAt,
        paymentStatus: order.payment?.status ?? null,
      },
      input.amount,
      committed
    );

    const type: RefundType = input.type ?? (eligibility.isFull ? "full" : "partial");
    const refundId = `ref_${randomUUID()}`;

    await tx.$executeRaw`
      INSERT INTO "Refund" (
        "id", "orderId", "orderReturnId", "userId", "currency", "amount", "type",
        "status", "reason", "reference", "requestedById", "requestedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${refundId}, ${order.id}, ${input.orderReturnId ?? null}, ${order.userId}, ${currency},
        ${input.amount}, ${type}::"RefundType", 'requested'::"RefundStatus",
        ${input.reason ?? null}, ${input.reference}, ${input.requestedById ?? null}, now(), now(), now()
      )
      ON CONFLICT ("reference") DO NOTHING
    `;

    const refund = (await tx.refund.findUnique({ where: { reference: input.reference } })) as Refund;

    if (refund.id === refundId) {
      await recordHistory(tx, refund.id, null, "requested", input.requestedById ?? null, "ثبت درخواست بازپرداخت");
      await publishDomainEvent(tx, {
        type: MARKETPLACE_EVENTS.refundRequested,
        aggregateType: "Refund",
        aggregateId: refund.id,
        idempotencyKey: `${MARKETPLACE_EVENTS.refundRequested}:${refund.id}`,
        payload: { refundId: refund.id, orderId: order.id, amount: input.amount, type, currency },
      });
      return { refund, deduped: false };
    }

    return { refund, deduped: true };
  });
}

type TransitionOptions = {
  changedById?: string | null;
  note?: string | null;
};

async function transitionRefund(
  tx: PrismaTx,
  refundId: string,
  to: RefundStatus,
  timestampField: keyof Refund,
  actorField: "reviewedById" | "approvedById" | "processedById" | null,
  options: TransitionOptions & { failureReason?: string | null } = {}
): Promise<Refund> {
  const current = await tx.refund.findUnique({ where: { id: refundId } });
  if (!current) throw new RefundNotFoundError();

  assertRefundTransition(current.status, to);

  const data: Record<string, unknown> = { status: to, [timestampField]: new Date() };
  if (actorField && options.changedById) data[actorField] = options.changedById;
  if (options.failureReason !== undefined) data.failureReason = options.failureReason;

  const updated = await tx.refund.updateMany({
    where: { id: refundId, status: current.status },
    data,
  });
  if (updated.count === 0) throw new RefundConflictError();

  await recordHistory(tx, refundId, current.status, to, options.changedById ?? null, options.note);

  return (await tx.refund.findUnique({ where: { id: refundId } })) as Refund;
}

export function reviewRefund(refundId: string, options: TransitionOptions = {}): Promise<Refund> {
  return prisma.$transaction((client) =>
    transitionRefund(client as unknown as PrismaTx, refundId, "under_review", "reviewedAt", "reviewedById", {
      ...options,
      note: options.note ?? "در حال بررسی",
    })
  );
}

export function approveRefund(refundId: string, options: TransitionOptions = {}): Promise<Refund> {
  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;
    const refund = await transitionRefund(tx, refundId, "approved", "approvedAt", "approvedById", {
      ...options,
      note: options.note ?? "تأیید شد",
    });
    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.refundApproved,
      aggregateType: "Refund",
      aggregateId: refund.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.refundApproved}:${refund.id}`,
      payload: { refundId: refund.id, orderId: refund.orderId, amount: Number(refund.amount) },
    });
    return refund;
  });
}

export function rejectRefund(
  refundId: string,
  options: TransitionOptions & { reason?: string | null } = {}
): Promise<Refund> {
  return prisma.$transaction((client) =>
    transitionRefund(client as unknown as PrismaTx, refundId, "rejected", "rejectedAt", "reviewedById", {
      ...options,
      failureReason: options.reason ?? null,
      note: options.note ?? "رد شد",
    })
  );
}

export function startRefundProcessing(refundId: string, options: TransitionOptions = {}): Promise<Refund> {
  return prisma.$transaction((client) =>
    transitionRefund(client as unknown as PrismaTx, refundId, "processing", "processingAt", "processedById", {
      ...options,
      note: options.note ?? "در حال پردازش",
    })
  );
}

/**
 * Completes the refund: performs settlement/commission reversal (and payout
 * recovery when already paid out) atomically, then publishes RefundCompleted.
 * Replay-safe — the reversal engine is idempotent and the status guard ensures
 * the transition applies once.
 */
export function completeRefund(refundId: string, options: TransitionOptions = {}): Promise<Refund> {
  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;
    const refund = await transitionRefund(tx, refundId, "completed", "completedAt", "processedById", {
      ...options,
      note: options.note ?? "بازپرداخت تکمیل شد",
    });

    const reversals = await reverseSettlementsForRefund(tx, refund);

    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.refundCompleted,
      aggregateType: "Refund",
      aggregateId: refund.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.refundCompleted}:${refund.id}`,
      payload: {
        refundId: refund.id,
        orderId: refund.orderId,
        amount: Number(refund.amount),
        reversals,
      },
    });

    return refund;
  });
}

export function failRefund(
  refundId: string,
  options: TransitionOptions & { reason?: string | null } = {}
): Promise<Refund> {
  return prisma.$transaction((client) =>
    transitionRefund(client as unknown as PrismaTx, refundId, "failed", "failedAt", "processedById", {
      ...options,
      failureReason: options.reason ?? "بازپرداخت ناموفق بود",
      note: options.note ?? "ناموفق",
    })
  );
}

export type RefundAction = "review" | "approve" | "reject" | "process" | "complete" | "fail";

export const REFUND_ACTIONS: readonly RefundAction[] = [
  "review",
  "approve",
  "reject",
  "process",
  "complete",
  "fail",
];

export function isRefundAction(value: string): value is RefundAction {
  return (REFUND_ACTIONS as readonly string[]).includes(value);
}

export function applyRefundAction(
  refundId: string,
  action: RefundAction,
  options: TransitionOptions & { reason?: string | null } = {}
): Promise<Refund> {
  switch (action) {
    case "review":
      return reviewRefund(refundId, options);
    case "approve":
      return approveRefund(refundId, options);
    case "reject":
      return rejectRefund(refundId, options);
    case "process":
      return startRefundProcessing(refundId, options);
    case "complete":
      return completeRefund(refundId, options);
    case "fail":
      return failRefund(refundId, options);
    default:
      throw new RefundError("عملیات نامعتبر است.", "refund_invalid_action");
  }
}
