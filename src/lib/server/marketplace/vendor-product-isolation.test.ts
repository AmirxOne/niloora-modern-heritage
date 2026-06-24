import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  productFindUnique,
  productUpdate,
  productFindUniqueOrThrow,
  transaction,
} = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  productFindUniqueOrThrow: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findUnique: productFindUnique,
      update: productUpdate,
      findUniqueOrThrow: productFindUniqueOrThrow,
      count: vi.fn().mockResolvedValue(0),
    },
    productListing: { upsert: vi.fn() },
    $transaction: transaction,
  },
}));

vi.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendor: vi.fn(),
}));

import { requireActiveVendor } from "@/lib/server/vendor/vendor-guards";
import { updateVendorProduct } from "@/lib/server/marketplace/vendor-product-service";

const vendorAMembership = {
  vendorId: "vendor-a",
  vendor: { id: "vendor-a", slug: "vendor-a", status: "active" },
};

describe("updateVendorProduct vendor isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireActiveVendor).mockResolvedValue(vendorAMembership as never);
    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        product: {
          update: productUpdate,
          findUniqueOrThrow: productFindUniqueOrThrow,
        },
        productListing: { upsert: vi.fn() },
      })
    );
    productFindUniqueOrThrow.mockResolvedValue({ id: "p-b", publicationStatus: "draft" });
    productUpdate.mockResolvedValue({});
  });

  it("rejects cross-vendor PATCH with VENDOR_PRODUCT_FORBIDDEN", async () => {
    productFindUnique.mockResolvedValue({
      id: "p-b",
      vendorId: "vendor-b",
      publicationStatus: "draft",
    });

    await expect(
      updateVendorProduct("user-a", "p-b", { name: "Stolen edit" })
    ).rejects.toThrow("VENDOR_PRODUCT_FORBIDDEN");

    expect(productUpdate).not.toHaveBeenCalled();
  });
});
