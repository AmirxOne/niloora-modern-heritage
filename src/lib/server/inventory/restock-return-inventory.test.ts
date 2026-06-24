import { beforeEach, describe, expect, it, vi } from "vitest";
import { INVENTORY_LOG_REASON, PRODUCT_AVAILABILITY } from "@/lib/server/commerce/statuses";
import { restockInventoryForApprovedReturn } from "@/lib/server/inventory/restock-return-inventory";

const mocks = vi.hoisted(() => ({
  orderReturnFindUnique: vi.fn(),
  inventoryLogFindFirst: vi.fn(),
  productFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  inventoryLogCreate: vi.fn(),
  reverseLedger: vi.fn(),
}));

vi.mock("@/lib/server/marketplace/ledger/reverse-ledger-entries-for-order-items", () => ({
  reverseLedgerEntriesForOrderItemIds: mocks.reverseLedger,
}));

function makeTx() {
  return {
    orderReturn: { findUnique: mocks.orderReturnFindUnique },
    inventoryLog: {
      findFirst: mocks.inventoryLogFindFirst,
      create: mocks.inventoryLogCreate,
    },
    product: {
      findUnique: mocks.productFindUnique,
      update: mocks.productUpdate,
    },
  };
}

describe("restockInventoryForApprovedReturn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.inventoryLogFindFirst.mockResolvedValue(null);
    mocks.inventoryLogCreate.mockResolvedValue({ id: "log-1" });
    mocks.reverseLedger.mockResolvedValue(1);
  });

  it("restocks sold products back to ready when quantity returns", async () => {
    mocks.orderReturnFindUnique.mockResolvedValue({
      id: "ret-1",
      status: "approved",
      items: [
        {
          quantity: 1,
          orderItem: { id: "item-1", productId: "prod-1" },
        },
      ],
    });
    mocks.productFindUnique.mockResolvedValue({
      id: "prod-1",
      stock: 0,
      availability: PRODUCT_AVAILABILITY.sold,
    });
    mocks.productUpdate.mockResolvedValue({ id: "prod-1" });

    const result = await restockInventoryForApprovedReturn(makeTx() as never, "ret-1");

    expect(result.restockedLines).toBe(1);
    expect(mocks.productUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: {
        stock: { increment: 1 },
        availability: PRODUCT_AVAILABILITY.ready,
      },
    });
    expect(mocks.inventoryLogCreate).toHaveBeenCalledWith({
      data: {
        productId: "prod-1",
        change: 1,
        reason: INVENTORY_LOG_REASON.returnApproved,
        orderReturnId: "ret-1",
      },
    });
    expect(mocks.reverseLedger).toHaveBeenCalledWith(expect.anything(), ["item-1"]);
  });

  it("is idempotent when restock log already exists", async () => {
    mocks.orderReturnFindUnique.mockResolvedValue({
      id: "ret-1",
      status: "approved",
      items: [
        {
          quantity: 1,
          orderItem: { id: "item-1", productId: "prod-1" },
        },
      ],
    });
    mocks.inventoryLogFindFirst.mockResolvedValue({ id: "existing" });

    const result = await restockInventoryForApprovedReturn(makeTx() as never, "ret-1");

    expect(result.restockedLines).toBe(0);
    expect(mocks.productUpdate).not.toHaveBeenCalled();
  });
});
