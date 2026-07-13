import { randomUUID } from "node:crypto";
import type { PrismaClient, Settlement } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  MARKETPLACE_EVENTS,
  publishDomainEvent,
} from "@/lib/server/marketplace/events/domain-events";
import {
  evaluateOrderVendorEligibility,
  findEligibleSettlementGroups,
} from "@/lib/server/marketplace/settlement/settlement-eligibility";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export type SettleOrderVendorInput = {
  orderId: string;
  vendorId: string;
  actorId?: string | null;
  now?: Date;
};

export type SettleOrderVendorResult = {
  settled: boolean;
  deduped: boolean;
  reason?: string;
  settlementId?: string;
  netAmount?: number;
};

function settlementIdempotencyKey(orderId: string, vendorId: string): string {
  return `settlement:${orderId}:${vendorId}`;
}

/**
 * Settles a single (order, vendor) group into a payable Settlement record.
 * The settlement itself is the payable. Idempotent and
 * transactional so replays never create duplicate payables.
 */
export async function settleOrderVendor(
  input: SettleOrderVendorInput
): Promise<SettleOrderVendorResult> {
  const { orderId, vendorId } = input;
  const now = input.now ?? new Date();

  return prisma.$transaction(async (client) => {
    const tx = client as unknown as PrismaTx;

    const decision = await evaluateOrderVendorEligibility(tx, orderId, vendorId, now);
    if (!decision.eligible) {
      return { settled: false, deduped: false, reason: decision.reason };
    }
    const group = decision.group;

    const idempotencyKey = settlementIdempotencyKey(orderId, vendorId);
    const settlementId = `stl_${randomUUID()}`;
    await tx.$executeRaw`
      INSERT INTO "Settlement" (
        "id", "orderId", "vendorId", "currency", "grossAmount", "commissionAmount",
        "netAmount", "status", "eligibleAt", "idempotencyKey", "createdAt", "updatedAt"
      )
      VALUES (
        ${settlementId}, ${orderId}, ${vendorId}, ${group.currency},
        ${group.grossAmount}, ${group.commissionAmount}, ${group.netAmount},
        'eligible'::"SettlementStatus", ${now}, ${idempotencyKey}, now(), now()
      )
      ON CONFLICT ("orderId", "vendorId") DO NOTHING
    `;

    const settlement = (await tx.settlement.findUnique({
      where: { orderId_vendorId: { orderId, vendorId } },
    })) as Settlement;

    if (settlement.status === "settled" || settlement.status === "paid_out") {
      return {
        settled: false,
        deduped: true,
        settlementId: settlement.id,
        netAmount: Number(settlement.netAmount),
      };
    }
    if (settlement.status === "reversed") {
      return { settled: false, deduped: false, reason: "settlement_reversed" };
    }

    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.settlementEligible,
      aggregateType: "Settlement",
      aggregateId: settlement.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.settlementEligible}:${settlement.id}`,
      payload: { orderId, vendorId, netAmount: group.netAmount, ledgerItemIds: group.ledgerItemIds },
    });
    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.commissionCalculated,
      aggregateType: "Settlement",
      aggregateId: settlement.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.commissionCalculated}:${settlement.id}`,
      payload: {
        orderId,
        vendorId,
        grossAmount: group.grossAmount,
        commissionAmount: group.commissionAmount,
        netAmount: group.netAmount,
      },
    });

    await tx.vendorPayoutLedger.updateMany({
      where: { orderId, vendorId, status: "pending" },
      data: { status: "paid", paidAt: now },
    });

    await tx.settlement.update({
      where: { id: settlement.id },
      data: { status: "settled", settledAt: now },
    });

    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.settlementCreated,
      aggregateType: "Settlement",
      aggregateId: settlement.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.settlementCreated}:${settlement.id}`,
      payload: {
        orderId,
        vendorId,
        netAmount: group.netAmount,
        actorId: input.actorId ?? null,
      },
    });

    return {
      settled: true,
      deduped: false,
      settlementId: settlement.id,
      netAmount: group.netAmount,
    };
  });
}

export type RunSettlementResult = {
  evaluated: number;
  settled: number;
  deduped: number;
  skipped: number;
  totalNetSettled: number;
  results: Array<SettleOrderVendorResult & { orderId: string; vendorId: string }>;
};

export async function runSettlementEngine(
  options: { actorId?: string | null; now?: Date } = {}
): Promise<RunSettlementResult> {
  const now = options.now ?? new Date();
  const groups = await findEligibleSettlementGroups(now);

  const result: RunSettlementResult = {
    evaluated: groups.length,
    settled: 0,
    deduped: 0,
    skipped: 0,
    totalNetSettled: 0,
    results: [],
  };

  for (const group of groups) {
    const outcome = await settleOrderVendor({
      orderId: group.orderId,
      vendorId: group.vendorId,
      actorId: options.actorId ?? null,
      now,
    });
    result.results.push({ ...outcome, orderId: group.orderId, vendorId: group.vendorId });
    if (outcome.settled) {
      result.settled += 1;
      result.totalNetSettled += outcome.netAmount ?? 0;
    } else if (outcome.deduped) {
      result.deduped += 1;
    } else {
      result.skipped += 1;
    }
  }

  return result;
}
