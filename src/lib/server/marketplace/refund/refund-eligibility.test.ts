import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/prisma", () => ({ prisma: {} }));

import {
  assertRefundEligible,
  getCommittedRefundAmount,
  type RefundEligibleOrder,
} from "@/lib/server/marketplace/refund/refund-eligibility";
import {
  RefundAmountError,
  RefundIneligibleError,
} from "@/lib/server/marketplace/refund/refund-errors";

const paidOrder: RefundEligibleOrder = {
  id: "o1",
  total: 1000,
  finalizedAt: new Date("2026-06-01T00:00:00Z"),
  paymentStatus: "paid",
};

describe("assertRefundEligible", () => {
  it("allows a full refund on a paid, finalized order", () => {
    const result = assertRefundEligible(paidOrder, 1000, 0);
    expect(result).toEqual({ remaining: 1000, isFull: true });
  });

  it("allows a partial refund within the remaining balance", () => {
    const result = assertRefundEligible(paidOrder, 400, 200);
    expect(result.remaining).toBe(800);
    expect(result.isFull).toBe(false);
  });

  it("rejects when the order is not finalized", () => {
    expect(() => assertRefundEligible({ ...paidOrder, finalizedAt: null }, 100, 0)).toThrow(
      RefundIneligibleError
    );
  });

  it("rejects when payment is not paid", () => {
    expect(() => assertRefundEligible({ ...paidOrder, paymentStatus: "pending" }, 100, 0)).toThrow(
      RefundIneligibleError
    );
  });

  it("rejects non-positive amounts", () => {
    expect(() => assertRefundEligible(paidOrder, 0, 0)).toThrow(RefundAmountError);
  });

  it("rejects amounts above the remaining refundable balance", () => {
    expect(() => assertRefundEligible(paidOrder, 500, 800)).toThrow(RefundAmountError);
  });

  it("rejects when the order is already fully refunded", () => {
    expect(() => assertRefundEligible(paidOrder, 100, 1000)).toThrow(RefundIneligibleError);
  });
});

describe("getCommittedRefundAmount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sums committed refund amounts (BigInt-safe)", async () => {
    const tx = {
      refund: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: BigInt(700) } }) },
    } as never;
    expect(await getCommittedRefundAmount(tx, "o1")).toBe(700);
  });

  it("returns 0 when nothing is committed", async () => {
    const tx = {
      refund: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
    } as never;
    expect(await getCommittedRefundAmount(tx, "o1")).toBe(0);
  });
});
