import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userPreferenceFindMany: vi.fn(),
  backInStockAlertGroupBy: vi.fn(),
  productFindMany: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    userPreference: { findMany: mocks.userPreferenceFindMany },
    backInStockAlert: { groupBy: mocks.backInStockAlertGroupBy },
    product: { findMany: mocks.productFindMany },
  },
}));

import { getAdminDemandAnalytics } from "@/lib/server/admin/demand-analytics";

describe("getAdminDemandAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userPreferenceFindMany.mockResolvedValue([
      { wishlistIds: ["p1", "p2"] },
      { wishlistIds: ["p1"] },
    ]);
    mocks.backInStockAlertGroupBy.mockResolvedValue([
      { productId: "p1", _count: { _all: 2 } },
      { productId: "p3", _count: { _all: 1 } },
    ]);
    mocks.productFindMany.mockResolvedValue([
      { id: "p1", name: "محصول یک" },
      { id: "p2", name: "محصول دو" },
      { id: "p3", name: "محصول سه" },
    ]);
  });

  it("ranks products by combined wishlist and back-in-stock demand", async () => {
    const result = await getAdminDemandAnalytics(5);

    expect(result.topProducts[0]).toMatchObject({
      productId: "p1",
      wishlistCount: 2,
      pendingBackInStockCount: 2,
      demandScore: 4,
    });
    expect(result.topProducts.map((row) => row.productId)).toEqual(["p1", "p2", "p3"]);
    expect(result.topSearches.every((row) => row.isPlaceholder)).toBe(true);
  });

  it("returns empty top products when no demand signals exist", async () => {
    mocks.userPreferenceFindMany.mockResolvedValue([]);
    mocks.backInStockAlertGroupBy.mockResolvedValue([]);
    mocks.productFindMany.mockResolvedValue([]);

    const result = await getAdminDemandAnalytics();

    expect(result.topProducts).toEqual([]);
  });
});
