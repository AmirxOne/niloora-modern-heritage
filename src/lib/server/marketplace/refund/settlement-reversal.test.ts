import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", () => ({ randomUUID: () => "fixed-uuid" }));

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  ledgerFindMany: vi.fn(),
  ledgerUpdateMany: vi.fn(),
  ledgerCount: vi.fn(),
  settlementFindUnique: vi.fn(),
  settlementUpdate: vi.fn(),
  reversalFindUnique: vi.fn(),
  reversalCreate: vi.fn(),
  recoveryCreate: vi.fn(),
  recoveryUpdate: vi.fn(),
  payoutSettlementFindUnique: vi.fn(),
  payoutSettlementDelete: vi.fn(),
  payoutSettlementAggregate: vi.fn(),
  payoutFindUnique: vi.fn(),
  payoutUpdate: vi.fn(),
  payoutUpdateMany: vi.fn(),
  historyCreate: vi.fn(),
  returnItemFindMany: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({ prisma: {} }));

vi.mock("@/lib/server/marketplace/events/domain-events", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/server/marketplace/events/domain-events")>();
  return { ...actual, publishDomainEvent: mocks.publish };
});

import { reverseSettlementsForRefund } from "@/lib/server/marketplace/refund/settlement-reversal";

function makeTx() {
  return {
    orderReturnItem: { findMany: mocks.returnItemFindMany },
    vendorPayoutLedger: {
      findMany: mocks.ledgerFindMany,
      updateMany: mocks.ledgerUpdateMany,
      count: mocks.ledgerCount,
    },
    settlement: { findUnique: mocks.settlementFindUnique, update: mocks.settlementUpdate },
    settlementReversal: { findUnique: mocks.reversalFindUnique, create: mocks.reversalCreate },
    payoutRecovery: { create: mocks.recoveryCreate, update: mocks.recoveryUpdate },
    payoutSettlement: {
      findUnique: mocks.payoutSettlementFindUnique,
      delete: mocks.payoutSettlementDelete,
      aggregate: mocks.payoutSettlementAggregate,
    },
    payout: {
      findUnique: mocks.payoutFindUnique,
      update: mocks.payoutUpdate,
      updateMany: mocks.payoutUpdateMany,
    },
    payoutStatusHistory: { create: mocks.historyCreate },
  } as never;
}

const refund = { id: "refund1", orderId: "o1", orderReturnId: null, currency: "IRR" };

const ledgerRow = {
  id: "l1",
  vendorId: "v1",
  orderItemId: "oi1",
  grossAmount: 100,
  commissionAmount: 10,
  netAmount: 90,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ledgerFindMany.mockResolvedValue([ledgerRow]);
  mocks.ledgerUpdateMany.mockResolvedValue({ count: 1 });
  mocks.ledgerCount.mockResolvedValue(0);
  mocks.settlementFindUnique.mockResolvedValue({
    id: "stl1",
    status: "settled",
    netAmount: BigInt(90),
  });
  mocks.reversalFindUnique.mockResolvedValue(null);
  mocks.reversalCreate.mockResolvedValue({ id: "srv1" });
  mocks.recoveryCreate.mockResolvedValue({ id: "rec1" });
  mocks.publish.mockResolvedValue(undefined);
  mocks.payoutSettlementFindUnique.mockResolvedValue(null);
});

function publishedTypes() {
  return mocks.publish.mock.calls.map((c) => c[1].type);
}

describe("reverseSettlementsForRefund", () => {
  it("reverses unsettled settlement in place", async () => {
    const records = await reverseSettlementsForRefund(makeTx(), refund);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      vendorId: "v1",
      outcome: "settlement_reversed",
      recoveryId: null,
    });
    expect(mocks.settlementUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "reversed" }) })
    );
    expect(publishedTypes()).toContain("CommissionReversed");
    expect(publishedTypes()).toContain("SettlementReversed");
  });

  it("creates payout recovery when settlement is already paid_out", async () => {
    mocks.settlementFindUnique.mockResolvedValue({
      id: "stl1",
      status: "paid_out",
      netAmount: BigInt(90),
    });

    const records = await reverseSettlementsForRefund(makeTx(), refund);

    expect(records[0]).toMatchObject({
      outcome: "payout_adjustment_required",
      recoveryId: "rec1",
    });
    expect(mocks.recoveryCreate).toHaveBeenCalled();
    expect(publishedTypes()).toContain("PayoutAdjustmentRequired");
  });

  it("is idempotent: existing reversal is not re-applied", async () => {
    mocks.reversalFindUnique.mockResolvedValue({
      id: "srv1",
      amount: BigInt(90),
      outcome: "settlement_reversed",
    });

    const records = await reverseSettlementsForRefund(makeTx(), refund);

    expect(records[0].outcome).toBe("settlement_reversed");
    expect(mocks.reversalCreate).not.toHaveBeenCalled();
    expect(mocks.settlementUpdate).not.toHaveBeenCalled();
  });

  it("reverses commission only when no settlement exists", async () => {
    mocks.settlementFindUnique.mockResolvedValue(null);

    const records = await reverseSettlementsForRefund(makeTx(), refund);

    expect(records[0]).toMatchObject({ outcome: "commission_only", settlementId: null });
    expect(mocks.reversalCreate).not.toHaveBeenCalled();
  });

  it("detaches settlement from a pending payout before reversing", async () => {
    mocks.payoutSettlementFindUnique.mockResolvedValue({
      id: "psl1",
      payoutId: "pay1",
      amount: BigInt(90),
    });
    mocks.payoutFindUnique.mockResolvedValue({
      id: "pay1",
      status: "pending",
      amount: BigInt(90),
    });
    mocks.payoutSettlementAggregate.mockResolvedValue({ _sum: { amount: null } });
    mocks.payoutUpdateMany.mockResolvedValue({ count: 1 });
    mocks.historyCreate.mockResolvedValue({});

    await reverseSettlementsForRefund(makeTx(), refund);

    expect(mocks.payoutSettlementDelete).toHaveBeenCalledWith({ where: { id: "psl1" } });
    expect(mocks.payoutUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) })
    );
  });
});
