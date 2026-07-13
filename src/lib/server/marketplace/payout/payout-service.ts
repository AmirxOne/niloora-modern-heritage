import { randomUUID } from "node:crypto";
import type { Payout, PayoutStatus, PrismaClient, Settlement } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  MARKETPLACE_EVENTS,
  publishDomainEvent,
} from "@/lib/server/marketplace/events/domain-events";
import {
  assertPayoutTransition,
  PayoutTransitionError,
} from "@/lib/server/marketplace/payout/payout-state-machine";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export class PayoutError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PayoutError";
    this.code = code;
  }
}

export class PayoutNotFoundError extends PayoutError {
  constructor(message = "درخواست تسویه یافت نشد.") {
    super(message, "payout_not_found");
    this.name = "PayoutNotFoundError";
  }
}

export class PayoutNothingToPayError extends PayoutError {
  constructor(message = "تسویه قابل پرداختی برای این فروشنده وجود ندارد.") {
    super(message, "payout_nothing_to_pay");
    this.name = "PayoutNothingToPayError";
  }
}

export class PayoutConflictError extends PayoutError {
  constructor(message = "وضعیت درخواست تسویه تغییر کرده است.") {
    super(message, "payout_conflict");
    this.name = "PayoutConflictError";
  }
}

export { PayoutTransitionError };

async function recordHistory(
  tx: PrismaTx,
  payoutId: string,
  fromStatus: PayoutStatus | null,
  toStatus: PayoutStatus,
  changedById: string | null,
  note?: string | null
): Promise<void> {
  await tx.payoutStatusHistory.create({
    data: { payoutId, fromStatus, toStatus, changedById: changedById ?? null, note: note ?? null },
  });
}

/** Detach claimed settlements so they return to the payable pool. */
async function detachPayoutSettlements(tx: PrismaTx, payoutId: string): Promise<number> {
  const result = await tx.payoutSettlement.deleteMany({ where: { payoutId } });
  return result.count;
}

export type RequestPayoutInput = {
  vendorId: string;
  userId: string;
  /** Client-supplied idempotency key. */
  reference: string;
  /** Optional subset; when omitted, sweeps all unpaid settled settlements. */
  settlementIds?: string[];
  requestedById?: string | null;
  currency?: string;
};

export type RequestPayoutResult = {
  payout: Payout;
  deduped: boolean;
  settlementIds: string[];
};

/**
 * Creates a payout by atomically claiming settled (unpaid) settlements via
 * PayoutSettlement. Double-payout is prevented by unique(settlementId).
 */
export async function requestPayout(input: RequestPayoutInput): Promise<RequestPayoutResult> {
  const currency = input.currency?.trim() || "IRR";

  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;

    const existing = await tx.payout.findUnique({ where: { reference: input.reference } });
    if (existing) {
      const links = await tx.payoutSettlement.findMany({
        where: { payoutId: existing.id },
        select: { settlementId: true },
      });
      return {
        payout: existing,
        deduped: true,
        settlementIds: links.map((l) => l.settlementId),
      };
    }

    const candidates = (await tx.settlement.findMany({
      where: {
        vendorId: input.vendorId,
        status: "settled",
        payoutLink: null,
        ...(input.settlementIds?.length ? { id: { in: input.settlementIds } } : {}),
      },
      orderBy: { settledAt: "asc" },
    })) as Settlement[];

    if (candidates.length === 0) {
      throw new PayoutNothingToPayError();
    }

    // Placeholder amount=1 until claims succeed (CHECK amount > 0 in DB).
    const payoutId = `pay_${randomUUID()}`;
    await tx.$executeRaw`
      INSERT INTO "Payout" (
        "id", "vendorId", "userId", "currency", "amount", "status", "reference",
        "requestedById", "requestedAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${payoutId}, ${input.vendorId}, ${input.userId}, ${currency}, ${1},
        'pending'::"PayoutStatus", ${input.reference},
        ${input.requestedById ?? null}, now(), now(), now()
      )
      ON CONFLICT ("reference") DO NOTHING
    `;

    const payout = (await tx.payout.findUnique({
      where: { reference: input.reference },
    })) as Payout;

    if (payout.id !== payoutId) {
      const links = await tx.payoutSettlement.findMany({
        where: { payoutId: payout.id },
        select: { settlementId: true },
      });
      return {
        payout,
        deduped: true,
        settlementIds: links.map((l) => l.settlementId),
      };
    }

    let totalAmount = 0;
    const claimedIds: string[] = [];

    for (const settlement of candidates) {
      const net = Number(settlement.netAmount);
      if (net <= 0) continue;

      const linkId = `psl_${randomUUID()}`;
      const inserted = await tx.$executeRaw`
        INSERT INTO "PayoutSettlement" (
          "id", "payoutId", "settlementId", "vendorId", "amount", "createdAt"
        )
        VALUES (
          ${linkId}, ${payout.id}, ${settlement.id}, ${input.vendorId}, ${net}, now()
        )
        ON CONFLICT ("settlementId") DO NOTHING
      `;

      if (Number(inserted) > 0) {
        totalAmount += net;
        claimedIds.push(settlement.id);
      }
    }

    if (claimedIds.length === 0 || totalAmount <= 0) {
      await tx.payout.delete({ where: { id: payout.id } });
      throw new PayoutNothingToPayError();
    }

    const updated = await tx.payout.update({
      where: { id: payout.id },
      data: { amount: totalAmount },
    });

    await recordHistory(tx, payout.id, null, "pending", input.requestedById ?? null, "درخواست تسویه ثبت شد");
    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.payoutRequested,
      aggregateType: "Payout",
      aggregateId: payout.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.payoutRequested}:${payout.id}`,
      payload: {
        payoutId: payout.id,
        vendorId: input.vendorId,
        userId: input.userId,
        amount: totalAmount,
        currency,
        settlementIds: claimedIds,
      },
    });

    return { payout: updated, deduped: false, settlementIds: claimedIds };
  });
}

type TransitionOptions = {
  changedById?: string | null;
  note?: string | null;
};

async function transitionPayout(
  tx: PrismaTx,
  payoutId: string,
  to: PayoutStatus,
  timestampField: keyof Payout,
  actorField: "approvedById" | "processedById" | null,
  options: TransitionOptions & { failureReason?: string | null } = {}
): Promise<Payout> {
  const current = await tx.payout.findUnique({ where: { id: payoutId } });
  if (!current) throw new PayoutNotFoundError();

  assertPayoutTransition(current.status, to);

  const data: Record<string, unknown> = {
    status: to,
    [timestampField]: new Date(),
  };
  if (actorField && options.changedById) data[actorField] = options.changedById;
  if (options.failureReason !== undefined) data.failureReason = options.failureReason;

  const updated = await tx.payout.updateMany({
    where: { id: payoutId, status: current.status },
    data,
  });
  if (updated.count === 0) {
    throw new PayoutConflictError();
  }

  await recordHistory(tx, payoutId, current.status, to, options.changedById ?? null, options.note);

  return (await tx.payout.findUnique({ where: { id: payoutId } })) as Payout;
}

export async function approvePayout(
  payoutId: string,
  options: TransitionOptions = {}
): Promise<Payout> {
  return prisma.$transaction((client) =>
    transitionPayout(client as unknown as PrismaTx, payoutId, "approved", "approvedAt", "approvedById", {
      ...options,
      note: options.note ?? "تأیید شد",
    })
  );
}

export async function startPayoutProcessing(
  payoutId: string,
  options: TransitionOptions = {}
): Promise<Payout> {
  return prisma.$transaction((client) =>
    transitionPayout(client as unknown as PrismaTx, payoutId, "processing", "processingAt", "processedById", {
      ...options,
      note: options.note ?? "در حال پردازش",
    })
  );
}

export async function completePayout(
  payoutId: string,
  options: TransitionOptions = {}
): Promise<Payout> {
  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;
    const payout = await transitionPayout(tx, payoutId, "completed", "completedAt", "processedById", {
      ...options,
      note: options.note ?? "پرداخت تکمیل شد",
    });

    const links = await tx.payoutSettlement.findMany({
      where: { payoutId: payout.id },
      select: { settlementId: true },
    });
    const now = new Date();
    if (links.length > 0) {
      await tx.settlement.updateMany({
        where: { id: { in: links.map((l) => l.settlementId) }, status: "settled" },
        data: { status: "paid_out", paidOutAt: now },
      });
    }

    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.payoutCompleted,
      aggregateType: "Payout",
      aggregateId: payout.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.payoutCompleted}:${payout.id}`,
      payload: {
        payoutId: payout.id,
        vendorId: payout.vendorId,
        userId: payout.userId,
        amount: Number(payout.amount),
        currency: payout.currency,
        settlementIds: links.map((l) => l.settlementId),
      },
    });
    return payout;
  });
}

export async function rejectPayout(
  payoutId: string,
  options: TransitionOptions & { reason?: string | null } = {}
): Promise<Payout> {
  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;
    const payout = await transitionPayout(tx, payoutId, "rejected", "rejectedAt", null, {
      ...options,
      failureReason: options.reason ?? null,
      note: options.note ?? "رد شد",
    });
    await detachPayoutSettlements(tx, payout.id);
    return (await tx.payout.findUnique({ where: { id: payout.id } })) as Payout;
  });
}

export async function failPayout(
  payoutId: string,
  options: TransitionOptions & { reason?: string | null } = {}
): Promise<Payout> {
  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;
    const payout = await transitionPayout(tx, payoutId, "failed", "failedAt", null, {
      ...options,
      failureReason: options.reason ?? "پرداخت ناموفق بود",
      note: options.note ?? "ناموفق",
    });
    await detachPayoutSettlements(tx, payout.id);
    return (await tx.payout.findUnique({ where: { id: payout.id } })) as Payout;
  });
}

export type PayoutAction = "approve" | "reject" | "process" | "complete" | "fail";

export const PAYOUT_ACTIONS: readonly PayoutAction[] = [
  "approve",
  "reject",
  "process",
  "complete",
  "fail",
];

export function isPayoutAction(value: string): value is PayoutAction {
  return (PAYOUT_ACTIONS as readonly string[]).includes(value);
}

export async function applyPayoutAction(
  payoutId: string,
  action: PayoutAction,
  options: TransitionOptions & { reason?: string | null } = {}
): Promise<Payout> {
  switch (action) {
    case "approve":
      return approvePayout(payoutId, options);
    case "reject":
      return rejectPayout(payoutId, options);
    case "process":
      return startPayoutProcessing(payoutId, options);
    case "complete":
      return completePayout(payoutId, options);
    case "fail":
      return failPayout(payoutId, options);
    default:
      throw new PayoutError("عملیات نامعتبر است.", "payout_invalid_action");
  }
}
