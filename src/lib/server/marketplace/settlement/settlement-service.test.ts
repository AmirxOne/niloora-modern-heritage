import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", () => ({ randomUUID: () => "fixed-uuid" }));

const mocks = vi.hoisted(() => ({
  executeRaw: vi.fn(),
  settlementFindUnique: vi.fn(),
  settlementUpdate: vi.fn(),
  ledgerUpdateMany: vi.fn(),
  evaluate: vi.fn(),
  publish: vi.fn(),
}));

function makeTx() {
  return {
    $executeRaw: mocks.executeRaw,
    settlement: {
      findUnique: mocks.settlementFindUnique,
      update: mocks.settlementUpdate,
    },
    vendorPayoutLedger: { updateMany: mocks.ledgerUpdateMany },
  };
}

vi.mock("@/lib/server/prisma", () => ({
  prisma: { $transaction: (fn: (client: unknown) => unknown) => fn(makeTx()) },
}));

vi.mock("@/lib/server/marketplace/settlement/settlement-eligibility", () => ({
  evaluateOrderVendorEligibility: mocks.evaluate,
  findEligibleSettlementGroups: vi.fn(),
}));

vi.mock("@/lib/server/marketplace/events/domain-events", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/server/marketplace/events/domain-events")>();
  return { ...actual, publishDomainEvent: mocks.publish };
});

import { settleOrderVendor } from "@/lib/server/marketplace/settlement/settlement-service";

const SETTLEMENT_ID = "stl_fixed-uuid";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.executeRaw.mockResolvedValue(1);
  mocks.ledgerUpdateMany.mockResolvedValue({ count: 1 });
  mocks.settlementUpdate.mockResolvedValue({});
  mocks.publish.mockResolvedValue(undefined);
  mocks.evaluate.mockResolvedValue({
    eligible: true,
    group: {
      orderId: "o1",
      vendorId: "v1",
      currency: "IRR",
      grossAmount: 300,
      commissionAmount: 30,
      netAmount: 270,
      ledgerItemIds: ["l1"],
    },
  });
});

describe("settleOrderVendor", () => {
  it("creates a settled payable Settlement", async () => {
    mocks.settlementFindUnique.mockResolvedValue({
      id: SETTLEMENT_ID,
      status: "eligible",
      netAmount: BigInt(270),
    });

    const result = await settleOrderVendor({ orderId: "o1", vendorId: "v1" });

    expect(result.settled).toBe(true);
    expect(result.netAmount).toBe(270);
    expect(mocks.settlementUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "settled" }) })
    );
    expect(mocks.publish.mock.calls.map((c) => c[1].type)).toEqual(
      expect.arrayContaining(["SettlementEligible", "CommissionCalculated", "SettlementCreated"])
    );
  });

  it("dedupes already settled settlements", async () => {
    mocks.settlementFindUnique.mockResolvedValue({
      id: SETTLEMENT_ID,
      status: "settled",
      netAmount: BigInt(270),
    });

    const result = await settleOrderVendor({ orderId: "o1", vendorId: "v1" });
    expect(result.deduped).toBe(true);
    expect(mocks.ledgerUpdateMany).not.toHaveBeenCalled();
  });

  it("skips ineligible orders", async () => {
    mocks.evaluate.mockResolvedValue({ eligible: false, reason: "order_returned" });
    const result = await settleOrderVendor({ orderId: "o1", vendorId: "v1" });
    expect(result).toMatchObject({ settled: false, reason: "order_returned" });
    expect(mocks.executeRaw).not.toHaveBeenCalled();
  });

  it("skips reversed settlements", async () => {
    mocks.settlementFindUnique.mockResolvedValue({
      id: SETTLEMENT_ID,
      status: "reversed",
      netAmount: BigInt(270),
    });
    const result = await settleOrderVendor({ orderId: "o1", vendorId: "v1" });
    expect(result.reason).toBe("settlement_reversed");
  });
});
