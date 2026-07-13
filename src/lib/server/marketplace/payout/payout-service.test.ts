import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", () => ({ randomUUID: () => "fixed-uuid" }));

const mocks = vi.hoisted(() => ({
  payoutFindUnique: vi.fn(),
  payoutUpdate: vi.fn(),
  payoutUpdateMany: vi.fn(),
  payoutDelete: vi.fn(),
  settlementFindMany: vi.fn(),
  settlementUpdateMany: vi.fn(),
  payoutSettlementFindMany: vi.fn(),
  payoutSettlementDeleteMany: vi.fn(),
  historyCreate: vi.fn(),
  executeRaw: vi.fn(),
  publish: vi.fn(),
}));

function makeTx() {
  return {
    $executeRaw: mocks.executeRaw,
    payout: {
      findUnique: mocks.payoutFindUnique,
      update: mocks.payoutUpdate,
      updateMany: mocks.payoutUpdateMany,
      delete: mocks.payoutDelete,
    },
    settlement: {
      findMany: mocks.settlementFindMany,
      updateMany: mocks.settlementUpdateMany,
    },
    payoutSettlement: {
      findMany: mocks.payoutSettlementFindMany,
      deleteMany: mocks.payoutSettlementDeleteMany,
    },
    payoutStatusHistory: { create: mocks.historyCreate },
  };
}

vi.mock("@/lib/server/prisma", () => ({
  prisma: { $transaction: (fn: (client: unknown) => unknown) => fn(makeTx()) },
}));

vi.mock("@/lib/server/marketplace/events/domain-events", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/server/marketplace/events/domain-events")>();
  return { ...actual, publishDomainEvent: mocks.publish };
});

import {
  completePayout,
  failPayout,
  PayoutConflictError,
  PayoutNothingToPayError,
  rejectPayout,
  requestPayout,
} from "@/lib/server/marketplace/payout/payout-service";

const PAYOUT_ID = "pay_fixed-uuid";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.executeRaw.mockResolvedValue(1);
  mocks.historyCreate.mockResolvedValue({});
  mocks.publish.mockResolvedValue(undefined);
  mocks.payoutSettlementDeleteMany.mockResolvedValue({ count: 1 });
  mocks.payoutUpdateMany.mockResolvedValue({ count: 1 });
  mocks.settlementUpdateMany.mockResolvedValue({ count: 1 });
});

describe("requestPayout", () => {
  it("claims settled settlements and sets amount to their sum", async () => {
    mocks.payoutFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "pending", reference: "r1" });
    mocks.settlementFindMany.mockResolvedValue([
      { id: "s1", netAmount: BigInt(100), status: "settled" },
      { id: "s2", netAmount: BigInt(50), status: "settled" },
    ]);
    // First executeRaw = payout insert; next two = settlement claims
    mocks.executeRaw
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    mocks.payoutUpdate.mockResolvedValue({
      id: PAYOUT_ID,
      status: "pending",
      amount: BigInt(150),
      reference: "r1",
    });

    const { payout, deduped, settlementIds } = await requestPayout({
      vendorId: "v1",
      userId: "u1",
      reference: "r1",
    });

    expect(deduped).toBe(false);
    expect(Number(payout.amount)).toBe(150);
    expect(settlementIds).toEqual(["s1", "s2"]);
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "PayoutRequested" })
    );
  });

  it("is idempotent on reference", async () => {
    mocks.payoutFindUnique.mockResolvedValueOnce({ id: PAYOUT_ID, status: "pending" });
    mocks.payoutSettlementFindMany.mockResolvedValue([{ settlementId: "s1" }]);

    const { deduped, settlementIds } = await requestPayout({
      vendorId: "v1",
      userId: "u1",
      reference: "r1",
    });

    expect(deduped).toBe(true);
    expect(settlementIds).toEqual(["s1"]);
    expect(mocks.settlementFindMany).not.toHaveBeenCalled();
  });

  it("rejects when nothing is claimable", async () => {
    mocks.payoutFindUnique.mockResolvedValueOnce(null);
    mocks.settlementFindMany.mockResolvedValue([]);
    await expect(
      requestPayout({ vendorId: "v1", userId: "u1", reference: "r1" })
    ).rejects.toBeInstanceOf(PayoutNothingToPayError);
  });
});

describe("payout lifecycle", () => {
  it("marks settlements paid_out on complete", async () => {
    mocks.payoutFindUnique
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "processing", vendorId: "v1", userId: "u1", amount: BigInt(100), currency: "IRR" })
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "completed", vendorId: "v1", userId: "u1", amount: BigInt(100), currency: "IRR" });
    mocks.payoutSettlementFindMany.mockResolvedValue([{ settlementId: "s1" }, { settlementId: "s2" }]);

    await completePayout(PAYOUT_ID);
    expect(mocks.settlementUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["s1", "s2"] } }),
        data: expect.objectContaining({ status: "paid_out" }),
      })
    );
  });

  it("detaches settlements on reject", async () => {
    mocks.payoutFindUnique
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "pending" })
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "rejected" })
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "rejected" });

    await rejectPayout(PAYOUT_ID);
    expect(mocks.payoutSettlementDeleteMany).toHaveBeenCalledWith({ where: { payoutId: PAYOUT_ID } });
  });

  it("detaches settlements on fail", async () => {
    mocks.payoutFindUnique
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "processing" })
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "failed" })
      .mockResolvedValueOnce({ id: PAYOUT_ID, status: "failed" });

    await failPayout(PAYOUT_ID);
    expect(mocks.payoutSettlementDeleteMany).toHaveBeenCalled();
  });

  it("detects concurrent transition conflicts", async () => {
    mocks.payoutFindUnique.mockResolvedValueOnce({ id: PAYOUT_ID, status: "pending" });
    mocks.payoutUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(rejectPayout(PAYOUT_ID)).rejects.toBeInstanceOf(PayoutConflictError);
  });
});
