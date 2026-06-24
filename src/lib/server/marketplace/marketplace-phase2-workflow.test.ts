import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  vendorFindUnique,
  vendorCreate,
  vendorUpdate,
  vendorFindMany,
  vendorMemberFindFirst,
  productFindFirst,
  productFindUnique,
  productUpdate,
  productFindUniqueOrThrow,
  productModerationEventCreate,
  transaction,
} = vi.hoisted(() => ({
  vendorFindUnique: vi.fn(),
  vendorCreate: vi.fn(),
  vendorUpdate: vi.fn(),
  vendorFindMany: vi.fn(),
  vendorMemberFindFirst: vi.fn(),
  productFindFirst: vi.fn(),
  productFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  productFindUniqueOrThrow: vi.fn(),
  productModerationEventCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    vendor: {
      findUnique: vendorFindUnique,
      create: vendorCreate,
      update: vendorUpdate,
      findMany: vendorFindMany,
    },
    vendorMember: {
      findFirst: vendorMemberFindFirst,
    },
    product: {
      findFirst: productFindFirst,
      findUnique: productFindUnique,
      update: productUpdate,
      findUniqueOrThrow: productFindUniqueOrThrow,
      count: vi.fn().mockResolvedValue(0),
    },
    productModerationEvent: {
      create: productModerationEventCreate,
    },
    $transaction: transaction,
  },
}));

vi.mock("@/lib/server/vendor/vendor-guards", () => ({
  getVendorMembershipForUser: vi.fn(),
  requireActiveVendor: vi.fn(),
}));

vi.mock("@/lib/search/sync-product-search", () => ({
  syncProductSearchIndexSafe: vi.fn(),
  removeProductFromSearchIndex: vi.fn(),
}));

import { getVendorMembershipForUser, requireActiveVendor } from "@/lib/server/vendor/vendor-guards";
import { applyVendor, submitVendorApplication, approveVendor } from "@/lib/server/vendor/vendor-service";
import { submitVendorProduct } from "@/lib/server/marketplace/vendor-product-service";
import { approveProduct } from "@/lib/server/marketplace/moderation/product-moderation-service";

const activeMembership = {
  id: "member-1",
  userId: "user-1",
  vendorId: "vendor-1",
  role: "owner",
  vendor: {
    id: "vendor-1",
    slug: "test-vendor",
    displayName: "Test Vendor",
    status: "active",
    settings: { maxActiveProducts: 3, maxPendingSubmissions: 5, quotaMode: "default" },
    members: [{ userId: "user-1", role: "owner" }],
  },
};

const minimalAdminProduct = {
  id: "prod-v-1",
  vendorId: "vendor-1",
  publicationStatus: "pending_review",
  name: "Test",
  namePersian: "تست",
  price: 1000,
  image: "/img.jpg",
  images: [],
  listing: { headline: "h", tier: "premium", details: [] },
  preOwnedInfo: null,
  collection: null,
  category: "signet",
  metal: "sterling",
  stone: "turquoise",
  stoneShape: "round",
  engravingType: "none",
  availability: "ready",
  stock: 1,
  condition: "new",
  featured: false,
  bestseller: false,
  collectionId: null,
  updatedAt: new Date(),
};

describe("marketplace phase 2 workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({
        vendor: { create: vendorCreate },
        product: {
          update: productUpdate,
          findUniqueOrThrow: productFindUniqueOrThrow,
        },
        productModerationEvent: { create: productModerationEventCreate },
      })
    );
  });

  it("vendor apply creates draft vendor", async () => {
    vi.mocked(getVendorMembershipForUser).mockResolvedValue(null);
    vendorFindUnique.mockResolvedValue(null);
    vendorCreate.mockResolvedValue({
      id: "vendor-1",
      slug: "test-vendor",
      displayName: "Test Vendor",
      status: "draft",
      settings: {},
      members: [{ userId: "user-1", role: "owner" }],
    });

    const vendor = await applyVendor({
      userId: "user-1",
      displayName: "Test Vendor",
    });

    expect(vendor.status).toBe("draft");
    expect(vendorCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "draft" }),
      })
    );
  });

  it("vendor application submit moves to pending_review", async () => {
    vi.mocked(getVendorMembershipForUser).mockResolvedValue({
      ...activeMembership,
      vendor: { ...activeMembership.vendor, status: "draft" },
    } as never);
    vendorUpdate.mockResolvedValue({
      ...activeMembership.vendor,
      status: "pending_review",
      members: activeMembership.vendor.members,
      settings: activeMembership.vendor.settings,
    });

    const vendor = await submitVendorApplication("user-1");
    expect(vendor.status).toBe("pending_review");
    expect(vendorUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "pending_review" }),
      })
    );
  });

  it("admin vendor approve activates vendor", async () => {
    vendorFindUnique.mockResolvedValue({ id: "vendor-1", status: "pending_review" });
    vendorUpdate.mockResolvedValue({
      ...activeMembership.vendor,
      status: "active",
      members: activeMembership.vendor.members,
      settings: activeMembership.vendor.settings,
    });

    const vendor = await approveVendor("vendor-1");
    expect(vendor.status).toBe("active");
  });

  it("vendor product submit moves to pending_review", async () => {
    vi.mocked(requireActiveVendor).mockResolvedValue(activeMembership as never);
    vendorFindUnique.mockResolvedValue(activeMembership.vendor);
    productFindUnique.mockResolvedValue({
      id: "prod-v-1",
      vendorId: "vendor-1",
      publicationStatus: "draft",
    });
    productFindUniqueOrThrow.mockResolvedValue(minimalAdminProduct);

    const product = await submitVendorProduct("user-1", "prod-v-1");
    expect(product.publicationStatus).toBe("pending_review");
    expect(productUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { publicationStatus: "pending_review" },
      })
    );
  });

  it("admin product approve publishes product", async () => {
    productFindUnique.mockResolvedValue({
      id: "prod-v-1",
      vendorId: "vendor-1",
      publicationStatus: "pending_review",
    });
    productFindUniqueOrThrow.mockResolvedValue({
      ...minimalAdminProduct,
      publicationStatus: "published",
    });

    const product = await approveProduct({
      productId: "prod-v-1",
      actorUserId: "admin-1",
      actorRole: "admin",
    });

    expect(product.publicationStatus).toBe("published");
    expect(productUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { publicationStatus: "published" },
      })
    );
  });
});
