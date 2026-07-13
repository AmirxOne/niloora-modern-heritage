import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ledgerFindMany: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    vendorPayoutLedger: { findMany: mocks.ledgerFindMany },
  },
}));

import {
  evaluateOrderVendorEligibility,
  findEligibleSettlementGroups,
} from "@/lib/server/marketplace/settlement/settlement-eligibility";

describe("findEligibleSettlementGroups", () => {
  beforeEach(() => vi.clearAllMocks());

  it("groups and sums pending ledger rows per (order, vendor)", async () => {
    mocks.ledgerFindMany.mockResolvedValue([
      { id: "l1", orderId: "o1", vendorId: "v1", grossAmount: 100, commissionAmount: 10, netAmount: 90 },
      { id: "l2", orderId: "o1", vendorId: "v1", grossAmount: 200, commissionAmount: 20, netAmount: 180 },
      { id: "l3", orderId: "o1", vendorId: "v2", grossAmount: 50, commissionAmount: 5, netAmount: 45 },
    ]);

    const groups = await findEligibleSettlementGroups();

    expect(groups).toHaveLength(2);
    const v1 = groups.find((g) => g.vendorId === "v1")!;
    expect(v1).toMatchObject({ orderId: "o1", grossAmount: 300, commissionAmount: 30, netAmount: 270 });
    expect(v1.ledgerItemIds).toEqual(["l1", "l2"]);
    const v2 = groups.find((g) => g.vendorId === "v2")!;
    expect(v2.netAmount).toBe(45);
  });

  it("returns empty when nothing is pending", async () => {
    mocks.ledgerFindMany.mockResolvedValue([]);
    expect(await findEligibleSettlementGroups()).toEqual([]);
  });
});

describe("evaluateOrderVendorEligibility", () => {
  function makeTx(overrides: Record<string, unknown> = {}) {
    return {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "o1",
          status: "delivered",
          finalizedAt: new Date("2026-06-01T00:00:00Z"),
        }),
      },
      orderReturn: { findFirst: vi.fn().mockResolvedValue(null) },
      vendorPayoutLedger: {
        findMany: vi.fn().mockResolvedValue([
          { id: "l1", grossAmount: 100, commissionAmount: 10, netAmount: 90 },
        ]),
      },
      ...overrides,
    } as never;
  }

  const now = new Date("2026-06-10T00:00:00Z");

  it("is eligible for a delivered, return-free order with pending ledger", async () => {
    const result = await evaluateOrderVendorEligibility(makeTx(), "o1", "v1", now);
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.group.netAmount).toBe(90);
      expect(result.group.ledgerItemIds).toEqual(["l1"]);
    }
  });

  it("rejects when order not found", async () => {
    const tx = makeTx({ order: { findUnique: vi.fn().mockResolvedValue(null) } });
    const result = await evaluateOrderVendorEligibility(tx, "o1", "v1", now);
    expect(result).toEqual({ eligible: false, reason: "order_not_found" });
  });

  it("rejects when order is not delivered", async () => {
    const tx = makeTx({
      order: { findUnique: vi.fn().mockResolvedValue({ id: "o1", status: "shipped", finalizedAt: new Date() }) },
    });
    const result = await evaluateOrderVendorEligibility(tx, "o1", "v1", now);
    expect(result).toEqual({ eligible: false, reason: "order_not_delivered" });
  });

  it("rejects when the order has a blocking return", async () => {
    const tx = makeTx({ orderReturn: { findFirst: vi.fn().mockResolvedValue({ id: "r1" }) } });
    const result = await evaluateOrderVendorEligibility(tx, "o1", "v1", now);
    expect(result).toEqual({ eligible: false, reason: "order_returned" });
  });

  it("rejects when there are no pending ledger rows", async () => {
    const tx = makeTx({ vendorPayoutLedger: { findMany: vi.fn().mockResolvedValue([]) } });
    const result = await evaluateOrderVendorEligibility(tx, "o1", "v1", now);
    expect(result).toEqual({ eligible: false, reason: "no_pending_ledger" });
  });
});
