import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  commitInventory: vi.fn(),
  consumeGiftCard: vi.fn(),
  createGiftCard: vi.fn(),
  rewardReferral: vi.fn(),
  rewardLoyalty: vi.fn(),
  scheduleReminders: vi.fn(),
  createLedgerEntries: vi.fn(),
  logPaymentEvent: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdateMany: vi.fn(),
  promoUpdateMany: vi.fn(),
}));

vi.mock("@/lib/server/inventory/commit-order-inventory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/inventory/commit-order-inventory")>();
  return {
    ...actual,
    commitInventoryForPaidOrder: mocks.commitInventory,
  };
});

vi.mock("@/lib/server/gift-card/gift-card-service", () => ({
  consumeGiftCardForOrder: mocks.consumeGiftCard,
  createGiftCard: mocks.createGiftCard,
}));

vi.mock("@/lib/server/referral/referral", () => ({
  rewardReferralOnPaidOrder: mocks.rewardReferral,
}));

vi.mock("@/lib/server/loyalty/loyalty", () => ({
  rewardLoyaltyOnPaidOrder: mocks.rewardLoyalty,
}));

vi.mock("@/lib/server/notifications/maintenance-reminders", () => ({
  scheduleOrderMaintenanceReminders: mocks.scheduleReminders,
}));

vi.mock("@/lib/server/marketplace/ledger/create-ledger-entries-for-paid-order", () => ({
  createLedgerEntriesForPaidOrder: mocks.createLedgerEntries,
}));

vi.mock("@/lib/server/payment/log", () => ({
  logPaymentEvent: mocks.logPaymentEvent,
}));

import { InventoryCommitError } from "@/lib/server/inventory/commit-order-inventory";
import { finalizePaidOrder } from "@/lib/server/orders/finalize-paid-order";

function makeTx() {
  return {
    order: {
      findUnique: mocks.orderFindUnique,
      updateMany: mocks.orderUpdateMany,
    },
    promoCode: {
      updateMany: mocks.promoUpdateMany,
    },
  };
}

const baseOrder = {
  id: "order-1",
  userId: "user-1",
  orderType: "product",
  status: "pending_payment",
  giftCardCode: null,
  giftCardAppliedAmount: null,
  giftCardPurchaseAmount: null,
  giftCardRecipientName: null,
  giftCardRecipientContact: null,
  promoCode: null,
  loyaltyPointsEarned: 10,
  items: [{ id: "line-1", productId: "prod-1", quantity: 1, orderId: "order-1" }],
} as never;

describe("finalizePaidOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.orderFindUnique.mockResolvedValue({
      finalizedAt: null,
      inventoryCommittedAt: null,
      orderType: "product",
    });
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
    mocks.commitInventory.mockResolvedValue(undefined);
    mocks.createLedgerEntries.mockResolvedValue({ created: 0, skipped: 0 });
  });

  it("finalizes order and commits inventory", async () => {
    const result = await finalizePaidOrder(makeTx() as never, baseOrder);

    expect(result.alreadyFinalized).toBe(false);
    expect(result.inventoryCommitted).toBe(true);
    expect(mocks.commitInventory).toHaveBeenCalledOnce();
    expect(mocks.rewardLoyalty).toHaveBeenCalledOnce();
    expect(mocks.createLedgerEntries).toHaveBeenCalledOnce();
  });

  it("continues finalization when inventory commit fails (Option B)", async () => {
    mocks.commitInventory.mockRejectedValue(
      new InventoryCommitError("insufficient", { code: "insufficient_stock" })
    );

    const result = await finalizePaidOrder(makeTx() as never, baseOrder);

    expect(result.inventoryDeferred).toBe(true);
    expect(result.inventoryCommitted).toBe(false);
    expect(mocks.orderUpdateMany).toHaveBeenCalled();
    expect(mocks.rewardLoyalty).toHaveBeenCalledOnce();
    expect(mocks.logPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "inventory.commit.deferred" })
    );
  });

  it("is idempotent when order already finalized", async () => {
    mocks.orderFindUnique.mockResolvedValue({
      finalizedAt: new Date(),
      inventoryCommittedAt: new Date(),
      orderType: "product",
    });

    const result = await finalizePaidOrder(makeTx() as never, baseOrder);

    expect(result.alreadyFinalized).toBe(true);
    expect(mocks.commitInventory).not.toHaveBeenCalled();
    expect(mocks.rewardLoyalty).not.toHaveBeenCalled();
    expect(mocks.createLedgerEntries).not.toHaveBeenCalled();
  });
});
