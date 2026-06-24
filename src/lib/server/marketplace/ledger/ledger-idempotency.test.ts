import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveCommissionRule: vi.fn(),
  orderFindUnique: vi.fn(),
  ledgerFindUnique: vi.fn(),
  ledgerCreate: vi.fn(),
}));

vi.mock("@/lib/server/marketplace/commission/resolve-commission-rule", () => ({
  resolveCommissionRule: mocks.resolveCommissionRule,
}));

import { createLedgerEntriesForPaidOrder } from "@/lib/server/marketplace/ledger/create-ledger-entries-for-paid-order";

function makeTx() {
  return {
    order: { findUnique: mocks.orderFindUnique },
    vendorPayoutLedger: {
      findUnique: mocks.ledgerFindUnique,
      create: mocks.ledgerCreate,
    },
  };
}

const platformItem = {
  id: "line-platform",
  orderId: "order-1",
  vendorId: null,
  price: 50_000,
  quantity: 1,
} as never;

const vendorItem = {
  id: "line-vendor",
  orderId: "order-1",
  vendorId: "vendor-1",
  price: 100_000,
  quantity: 2,
} as never;

describe("createLedgerEntriesForPaidOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.orderFindUnique.mockResolvedValue({ finalizedAt: new Date("2026-06-24T12:00:00Z") });
    mocks.resolveCommissionRule.mockResolvedValue({
      id: "platform-default-commission",
      vendorId: null,
      commissionType: "percentage",
      value: 1000,
    });
    mocks.ledgerFindUnique.mockResolvedValue(null);
    mocks.ledgerCreate.mockResolvedValue({ id: "ledger-1" });
  });

  it("creates one ledger row for vendor items", async () => {
    const result = await createLedgerEntriesForPaidOrder(makeTx() as never, {
      id: "order-1",
      items: [vendorItem],
    } as never);

    expect(result).toEqual({ created: 1, skipped: 0 });
    expect(mocks.ledgerCreate).toHaveBeenCalledOnce();
    expect(mocks.ledgerCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        orderItemId: "line-vendor",
        vendorId: "vendor-1",
        grossAmount: 200_000,
        commissionAmount: 20_000,
        netAmount: 180_000,
        status: "pending",
      }),
    });
  });

  it("skips platform items without creating ledger rows", async () => {
    const result = await createLedgerEntriesForPaidOrder(makeTx() as never, {
      id: "order-1",
      items: [platformItem],
    } as never);

    expect(result).toEqual({ created: 0, skipped: 0 });
    expect(mocks.ledgerCreate).not.toHaveBeenCalled();
    expect(mocks.resolveCommissionRule).not.toHaveBeenCalled();
  });

  it("creates ledger only for vendor lines in a mixed order", async () => {
    const result = await createLedgerEntriesForPaidOrder(makeTx() as never, {
      id: "order-mixed",
      items: [platformItem, vendorItem],
    } as never);

    expect(result).toEqual({ created: 1, skipped: 0 });
    expect(mocks.ledgerCreate).toHaveBeenCalledOnce();
    expect(mocks.ledgerCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ orderItemId: "line-vendor", vendorId: "vendor-1" }),
    });
  });

  it("treats legacy order items without vendorId as platform (no ledger row)", async () => {
    const legacyItem = {
      id: "line-legacy",
      orderId: "order-legacy",
      vendorId: null,
      price: 250_000,
      quantity: 1,
    } as never;

    const result = await createLedgerEntriesForPaidOrder(makeTx() as never, {
      id: "order-legacy",
      items: [legacyItem],
    } as never);

    expect(result).toEqual({ created: 0, skipped: 0 });
    expect(mocks.ledgerCreate).not.toHaveBeenCalled();
  });

  it("is idempotent when called twice for the same order item", async () => {
    mocks.ledgerFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "ledger-1" });

    const order = { id: "order-1", items: [vendorItem] } as never;
    const tx = makeTx() as never;

    const first = await createLedgerEntriesForPaidOrder(tx, order);
    const second = await createLedgerEntriesForPaidOrder(tx, order);

    expect(first).toEqual({ created: 1, skipped: 0 });
    expect(second).toEqual({ created: 0, skipped: 1 });
    expect(mocks.ledgerCreate).toHaveBeenCalledOnce();
  });
});
