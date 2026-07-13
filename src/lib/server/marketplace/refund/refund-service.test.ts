import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", () => ({ randomUUID: () => "fixed-uuid" }));

const mocks = vi.hoisted(() => ({
  refundFindUnique: vi.fn(),
  refundUpdateMany: vi.fn(),
  orderFindUnique: vi.fn(),
  historyCreate: vi.fn(),
  executeRaw: vi.fn(),
  getCommitted: vi.fn(),
  assertEligible: vi.fn(),
  reverse: vi.fn(),
  publish: vi.fn(),
}));

function makeTx() {
  return {
    $executeRaw: mocks.executeRaw,
    refund: { findUnique: mocks.refundFindUnique, updateMany: mocks.refundUpdateMany },
    order: { findUnique: mocks.orderFindUnique },
    refundStatusHistory: { create: mocks.historyCreate },
  };
}

vi.mock("@/lib/server/prisma", () => ({
  prisma: { $transaction: (fn: (client: unknown) => unknown) => fn(makeTx()) },
}));

vi.mock("@/lib/server/marketplace/refund/refund-eligibility", () => ({
  getCommittedRefundAmount: mocks.getCommitted,
  assertRefundEligible: mocks.assertEligible,
}));

vi.mock("@/lib/server/marketplace/refund/settlement-reversal", () => ({
  reverseSettlementsForRefund: mocks.reverse,
}));

vi.mock("@/lib/server/marketplace/events/domain-events", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/server/marketplace/events/domain-events")>();
  return { ...actual, publishDomainEvent: mocks.publish };
});

import {
  approveRefund,
  completeRefund,
  RefundConflictError,
  RefundTransitionError,
  requestRefund,
} from "@/lib/server/marketplace/refund/refund-service";

const REFUND_ID = "ref_fixed-uuid";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.executeRaw.mockResolvedValue(1);
  mocks.refundUpdateMany.mockResolvedValue({ count: 1 });
  mocks.historyCreate.mockResolvedValue({});
  mocks.getCommitted.mockResolvedValue(0);
  mocks.assertEligible.mockReturnValue({ remaining: 1000, isFull: true });
  mocks.reverse.mockResolvedValue([]);
  mocks.publish.mockResolvedValue(undefined);
  mocks.orderFindUnique.mockResolvedValue({
    id: "o1",
    userId: "u1",
    total: 1000,
    finalizedAt: new Date(),
    payment: { status: "paid" },
  });
});

describe("requestRefund", () => {
  it("creates a refund and publishes RefundRequested", async () => {
    mocks.refundFindUnique
      .mockResolvedValueOnce(null) // reference lookup
      .mockResolvedValueOnce({ id: REFUND_ID, status: "requested" }); // after insert

    const { refund, deduped } = await requestRefund({
      orderId: "o1",
      amount: 1000,
      reference: "r-1",
      requestedById: "admin-1",
    });

    expect(deduped).toBe(false);
    expect(refund.id).toBe(REFUND_ID);
    expect(mocks.assertEligible).toHaveBeenCalled();
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "RefundRequested" })
    );
  });

  it("is idempotent on reference", async () => {
    mocks.refundFindUnique.mockResolvedValueOnce({ id: REFUND_ID, status: "requested" });

    const { deduped } = await requestRefund({ orderId: "o1", amount: 1000, reference: "r-1" });

    expect(deduped).toBe(true);
    expect(mocks.executeRaw).not.toHaveBeenCalled();
  });
});

describe("refund transitions", () => {
  it("approves a requested refund and publishes RefundApproved", async () => {
    mocks.refundFindUnique
      .mockResolvedValueOnce({ id: REFUND_ID, status: "requested" })
      .mockResolvedValueOnce({ id: REFUND_ID, status: "approved", orderId: "o1", amount: BigInt(1000) });

    const refund = await approveRefund(REFUND_ID, { changedById: "admin-1" });
    expect(refund.status).toBe("approved");
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "RefundApproved" })
    );
  });

  it("completes a processing refund, runs reversal, and publishes RefundCompleted", async () => {
    mocks.refundFindUnique
      .mockResolvedValueOnce({ id: REFUND_ID, status: "processing" })
      .mockResolvedValueOnce({
        id: REFUND_ID,
        status: "completed",
        orderId: "o1",
        orderReturnId: null,
        currency: "IRR",
        amount: BigInt(1000),
      });

    const refund = await completeRefund(REFUND_ID, { changedById: "admin-1" });
    expect(refund.status).toBe("completed");
    expect(mocks.reverse).toHaveBeenCalledTimes(1);
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "RefundCompleted" })
    );
  });

  it("blocks invalid transitions (complete an approved refund)", async () => {
    mocks.refundFindUnique.mockResolvedValueOnce({ id: REFUND_ID, status: "approved" });
    await expect(completeRefund(REFUND_ID)).rejects.toBeInstanceOf(RefundTransitionError);
    expect(mocks.reverse).not.toHaveBeenCalled();
  });

  it("detects concurrent transition conflicts", async () => {
    mocks.refundFindUnique.mockResolvedValueOnce({ id: REFUND_ID, status: "requested" });
    mocks.refundUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(approveRefund(REFUND_ID)).rejects.toBeInstanceOf(RefundConflictError);
  });
});
