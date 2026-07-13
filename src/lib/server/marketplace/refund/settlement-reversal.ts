import { randomUUID } from "node:crypto";
import type { PrismaClient, Refund } from "@prisma/client";
import {
  MARKETPLACE_EVENTS,
  publishDomainEvent,
} from "@/lib/server/marketplace/events/domain-events";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type ReversibleLedgerRow = {
  id: string;
  vendorId: string | null;
  orderItemId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
};

export type SettlementReversalRecord = {
  vendorId: string;
  settlementId: string | null;
  netReversed: number;
  outcome: "settlement_reversed" | "payout_adjustment_required" | "commission_only";
  recoveryId: string | null;
};

const REVERSIBLE_LEDGER_STATUSES = ["pending", "eligible", "paid"] as const;

function reversalKey(refundId: string, settlementId: string): string {
  return `refund-reversal:${refundId}:${settlementId}`;
}

function recoveryKey(refundId: string, settlementId: string): string {
  return `payout-recovery:${refundId}:${settlementId}`;
}

/**
 * Detach a settlement from a not-yet-completed payout and shrink the payout
 * amount. If the payout becomes empty, auto-fail it.
 */
async function detachSettlementFromPendingPayout(
  tx: PrismaTx,
  settlementId: string
): Promise<void> {
  const link = await tx.payoutSettlement.findUnique({
    where: { settlementId },
    select: { id: true, payoutId: true, amount: true },
  });
  if (!link) return;

  const payout = await tx.payout.findUnique({
    where: { id: link.payoutId },
    select: { id: true, status: true, amount: true },
  });
  if (!payout) return;
  // Already bank-transferred — do not detach; recovery path handles paid_out settlements.
  if (payout.status === "completed" || payout.status === "rejected" || payout.status === "failed") {
    return;
  }

  await tx.payoutSettlement.delete({ where: { id: link.id } });

  const remaining = await tx.payoutSettlement.aggregate({
    where: { payoutId: payout.id },
    _sum: { amount: true },
  });
  const nextAmount = Number(remaining._sum.amount ?? 0);

  if (nextAmount <= 0) {
    await tx.payout.updateMany({
      where: {
        id: payout.id,
        status: { in: ["pending", "approved", "processing"] },
      },
      data: {
        status: "failed",
        failedAt: new Date(),
        failureReason: "تسویه مرتبط با بازپرداخت خالی شد",
        amount: 1, // keep CHECK(amount > 0); no settlements remain
      },
    });
    await tx.payoutStatusHistory.create({
      data: {
        payoutId: payout.id,
        fromStatus: payout.status,
        toStatus: "failed",
        note: "خودکار: همه تسویه‌ها به‌دلیل بازپرداخت جدا شدند",
      },
    });
  } else {
    await tx.payout.update({
      where: { id: payout.id },
      data: { amount: nextAmount },
    });
  }
}

/**
 * Reverses the seller side of a refund:
 *   - reverses commission ledger rows
 *   - if settlement is paid_out → PayoutRecovery
 *   - else → mark settlement reversed (+ detach from pending payout)
 */
export async function reverseSettlementsForRefund(
  tx: PrismaTx,
  refund: Pick<Refund, "id" | "orderId" | "orderReturnId" | "currency">
): Promise<SettlementReversalRecord[]> {
  let affectedOrderItemIds: Set<string> | null = null;
  if (refund.orderReturnId) {
    const returnItems = await tx.orderReturnItem.findMany({
      where: { returnId: refund.orderReturnId },
      select: { orderItemId: true },
    });
    affectedOrderItemIds = new Set(returnItems.map((r) => r.orderItemId));
  }

  const ledgerRows = (await tx.vendorPayoutLedger.findMany({
    where: {
      orderId: refund.orderId,
      vendorId: { not: null },
      status: { in: [...REVERSIBLE_LEDGER_STATUSES] },
      ...(affectedOrderItemIds
        ? { orderItemId: { in: Array.from(affectedOrderItemIds) } }
        : {}),
    },
    select: {
      id: true,
      vendorId: true,
      orderItemId: true,
      grossAmount: true,
      commissionAmount: true,
      netAmount: true,
    },
  })) as ReversibleLedgerRow[];

  const byVendor = new Map<string, ReversibleLedgerRow[]>();
  for (const row of ledgerRows) {
    if (!row.vendorId) continue;
    const list = byVendor.get(row.vendorId) ?? [];
    list.push(row);
    byVendor.set(row.vendorId, list);
  }

  const records: SettlementReversalRecord[] = [];

  for (const [vendorId, rows] of Array.from(byVendor.entries())) {
    const ledgerIds = rows.map((r) => r.id);
    const grossReversed = rows.reduce((s, r) => s + r.grossAmount, 0);
    const commissionReversed = rows.reduce((s, r) => s + r.commissionAmount, 0);
    const netReversed = rows.reduce((s, r) => s + r.netAmount, 0);

    await tx.vendorPayoutLedger.updateMany({
      where: { id: { in: ledgerIds }, status: { not: "reversed" } },
      data: { status: "reversed", reversedAt: new Date() },
    });

    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.commissionReversed,
      aggregateType: "Refund",
      aggregateId: refund.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.commissionReversed}:${refund.id}:${vendorId}`,
      payload: {
        refundId: refund.id,
        vendorId,
        grossReversed,
        commissionReversed,
        netReversed,
        ledgerIds,
      },
    });

    const settlement = await tx.settlement.findUnique({
      where: { orderId_vendorId: { orderId: refund.orderId, vendorId } },
    });

    if (!settlement || settlement.status === "reversed") {
      records.push({
        vendorId,
        settlementId: settlement?.id ?? null,
        netReversed,
        outcome: "commission_only",
        recoveryId: null,
      });
      continue;
    }

    const remaining = await tx.vendorPayoutLedger.count({
      where: { orderId: refund.orderId, vendorId, status: { not: "reversed" } },
    });
    const fullVendorReversal = remaining === 0;

    const idemKey = reversalKey(refund.id, settlement.id);
    const existingReversal = await tx.settlementReversal.findUnique({
      where: { idempotencyKey: idemKey },
    });
    if (existingReversal) {
      records.push({
        vendorId,
        settlementId: settlement.id,
        netReversed: Number(existingReversal.amount),
        outcome:
          existingReversal.outcome === "settlement_reversed"
            ? "settlement_reversed"
            : "payout_adjustment_required",
        recoveryId: null,
      });
      continue;
    }

    let outcome: "settlement_reversed" | "payout_adjustment_required" = "settlement_reversed";
    let recoveryId: string | null = null;

    if (settlement.status === "paid_out" && netReversed > 0) {
      outcome = "payout_adjustment_required";
      const recovery = await tx.payoutRecovery.create({
        data: {
          vendorId,
          refundId: refund.id,
          currency: refund.currency,
          amount: netReversed,
          status: "pending",
          reason: "settlement reversed after payout",
          idempotencyKey: recoveryKey(refund.id, settlement.id),
        },
      });
      recoveryId = recovery.id;
      await publishDomainEvent(tx, {
        type: MARKETPLACE_EVENTS.payoutAdjustmentRequired,
        aggregateType: "PayoutRecovery",
        aggregateId: recovery.id,
        idempotencyKey: `${MARKETPLACE_EVENTS.payoutAdjustmentRequired}:${idemKey}`,
        payload: {
          refundId: refund.id,
          vendorId,
          settlementId: settlement.id,
          amount: netReversed,
        },
      });
    } else {
      // Not paid out yet: detach from any pending payout, then reverse.
      await detachSettlementFromPendingPayout(tx, settlement.id);
    }

    const reversal = await tx.settlementReversal.create({
      data: {
        id: `srv_${randomUUID()}`,
        refundId: refund.id,
        settlementId: settlement.id,
        vendorId,
        amount: netReversed,
        outcome,
        idempotencyKey: idemKey,
        note: fullVendorReversal ? "full vendor reversal" : "partial reversal",
      },
    });

    if (recoveryId) {
      await tx.payoutRecovery.update({
        where: { id: recoveryId },
        data: { settlementReversalId: reversal.id },
      });
    }

    if (fullVendorReversal && outcome === "settlement_reversed") {
      await tx.settlement.update({
        where: { id: settlement.id },
        data: { status: "reversed", reversedAt: new Date() },
      });
    } else if (fullVendorReversal && outcome === "payout_adjustment_required") {
      // Historical paid_out settlement stays paid_out for audit; recovery tracks debt.
      // Still mark reversed so it cannot be claimed again.
      await tx.settlement.update({
        where: { id: settlement.id },
        data: { status: "reversed", reversedAt: new Date() },
      });
    }

    await publishDomainEvent(tx, {
      type: MARKETPLACE_EVENTS.settlementReversed,
      aggregateType: "Settlement",
      aggregateId: settlement.id,
      idempotencyKey: `${MARKETPLACE_EVENTS.settlementReversed}:${idemKey}`,
      payload: {
        refundId: refund.id,
        vendorId,
        settlementId: settlement.id,
        amount: netReversed,
        fullVendorReversal,
        outcome,
      },
    });

    records.push({
      vendorId,
      settlementId: settlement.id,
      netReversed,
      outcome,
      recoveryId,
    });
  }

  return records;
}
