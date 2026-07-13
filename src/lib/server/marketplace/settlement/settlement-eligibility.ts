import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { ORDER_STATUS } from "@/lib/server/commerce/statuses";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** Order must be delivered before a seller's earnings can be settled. */
export const SETTLEMENT_ELIGIBLE_ORDER_STATUS = ORDER_STATUS.delivered;

/**
 * Return states that block settlement. A cancelled or rejected return does not
 * block (the sale stands); anything in-flight or refunded does.
 */
export const BLOCKING_RETURN_STATUSES = [
  "requested",
  "under_review",
  "approved",
  "refunded",
] as const;

/** Only these ledger rows are candidates for settlement. */
const SETTLEABLE_LEDGER_STATUS = "pending" as const;

export function getSettlementHoldDays(): number {
  const raw = Number.parseInt(process.env.SETTLEMENT_HOLD_DAYS ?? "", 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function holdCutoff(now: Date): Date {
  const days = getSettlementHoldDays();
  if (days === 0) return now;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export type EligibleSettlementGroup = {
  orderId: string;
  vendorId: string;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  ledgerItemIds: string[];
};

export type EligibilityDecision =
  | { eligible: true; group: EligibleSettlementGroup }
  | { eligible: false; reason: string };

/**
 * Scans the ledger for (order, vendor) groups that are ready to settle:
 *   - order delivered and finalized (payment captured)
 *   - past the optional settlement hold window
 *   - no in-flight/refunded return on the order
 *   - has pending (unsettled, non-reversed) ledger rows
 */
export async function findEligibleSettlementGroups(
  now: Date = new Date()
): Promise<EligibleSettlementGroup[]> {
  const rows = await prisma.vendorPayoutLedger.findMany({
    where: {
      status: SETTLEABLE_LEDGER_STATUS,
      vendorId: { not: null },
      order: {
        status: SETTLEMENT_ELIGIBLE_ORDER_STATUS,
        finalizedAt: { not: null, lte: holdCutoff(now) },
        returns: { none: { status: { in: [...BLOCKING_RETURN_STATUSES] } } },
      },
    },
    select: {
      id: true,
      orderId: true,
      vendorId: true,
      grossAmount: true,
      commissionAmount: true,
      netAmount: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, EligibleSettlementGroup>();
  for (const row of rows) {
    if (!row.vendorId) continue;
    const key = `${row.orderId}::${row.vendorId}`;
    const existing = groups.get(key);
    if (existing) {
      existing.grossAmount += row.grossAmount;
      existing.commissionAmount += row.commissionAmount;
      existing.netAmount += row.netAmount;
      existing.ledgerItemIds.push(row.id);
    } else {
      groups.set(key, {
        orderId: row.orderId,
        vendorId: row.vendorId,
        currency: "IRR",
        grossAmount: row.grossAmount,
        commissionAmount: row.commissionAmount,
        netAmount: row.netAmount,
        ledgerItemIds: [row.id],
      });
    }
  }

  return Array.from(groups.values());
}

/**
 * Re-evaluates a single (order, vendor) group inside the settlement transaction
 * to defend against races (e.g. a return filed between scan and settle).
 */
export async function evaluateOrderVendorEligibility(
  tx: PrismaTx,
  orderId: string,
  vendorId: string,
  now: Date = new Date()
): Promise<EligibilityDecision> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, finalizedAt: true },
  });
  if (!order) return { eligible: false, reason: "order_not_found" };
  if (order.status !== SETTLEMENT_ELIGIBLE_ORDER_STATUS) {
    return { eligible: false, reason: "order_not_delivered" };
  }
  if (!order.finalizedAt || order.finalizedAt > holdCutoff(now)) {
    return { eligible: false, reason: "hold_window_active" };
  }

  const blockingReturn = await tx.orderReturn.findFirst({
    where: { orderId, status: { in: [...BLOCKING_RETURN_STATUSES] } },
    select: { id: true },
  });
  if (blockingReturn) return { eligible: false, reason: "order_returned" };

  const ledgerRows = await tx.vendorPayoutLedger.findMany({
    where: { orderId, vendorId, status: SETTLEABLE_LEDGER_STATUS },
    select: {
      id: true,
      grossAmount: true,
      commissionAmount: true,
      netAmount: true,
    },
  });
  if (ledgerRows.length === 0) {
    return { eligible: false, reason: "no_pending_ledger" };
  }

  const group: EligibleSettlementGroup = {
    orderId,
    vendorId,
    currency: "IRR",
    grossAmount: 0,
    commissionAmount: 0,
    netAmount: 0,
    ledgerItemIds: [],
  };
  for (const row of ledgerRows) {
    group.grossAmount += row.grossAmount;
    group.commissionAmount += row.commissionAmount;
    group.netAmount += row.netAmount;
    group.ledgerItemIds.push(row.id);
  }

  return { eligible: true, group };
}
