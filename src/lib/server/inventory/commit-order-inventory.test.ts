import { beforeEach, describe, expect, it, vi } from "vitest";
import { INVENTORY_LOG_REASON } from "@/lib/server/commerce/statuses";
import {
  commitInventoryForPaidOrder,
  InventoryCommitError,
} from "@/lib/server/inventory/commit-order-inventory";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  inventoryLogCreate: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({}));

function makeTx() {
  return {
    product: {
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
    inventoryLog: {
      findFirst: mocks.findFirst,
      create: mocks.inventoryLogCreate,
    },
  };
}

describe("commitInventoryForPaidOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue(null);
    mocks.inventoryLogCreate.mockResolvedValue({ id: "log-1" });
  });

  it("decrements stock and marks sold when stock reaches zero", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "prod-1",
      name: "Ring",
      stock: 1,
      availability: "ready",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await commitInventoryForPaidOrder(
      makeTx() as never,
      [{ productId: "prod-1", quantity: 1 }],
      "order-1"
    );

    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "prod-1", stock: { gte: 1 } }),
        data: expect.objectContaining({
          stock: { decrement: 1 },
          availability: "sold",
        }),
      })
    );
    expect(mocks.inventoryLogCreate).toHaveBeenCalledWith({
      data: {
        productId: "prod-1",
        change: -1,
        reason: INVENTORY_LOG_REASON.orderPaid,
        orderId: "order-1",
      },
    });
  });

  it("throws when stock is insufficient", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "prod-1",
      name: "Ring",
      stock: 0,
      availability: "ready",
    });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      commitInventoryForPaidOrder(makeTx() as never, [{ productId: "prod-1", quantity: 1 }], "order-1")
    ).rejects.toBeInstanceOf(InventoryCommitError);
  });

  it("skips products already logged for the order (idempotent retry)", async () => {
    mocks.findFirst.mockResolvedValue({ id: "existing-log" });

    await commitInventoryForPaidOrder(
      makeTx() as never,
      [{ productId: "prod-1", quantity: 1 }],
      "order-1"
    );

    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
