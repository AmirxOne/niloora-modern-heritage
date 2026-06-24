import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productCount: vi.fn(),
  rankCatalogRows: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findMany: mocks.productFindMany,
      count: mocks.productCount,
      aggregate: vi.fn().mockResolvedValue({ _max: { price: 0 } }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ exists: false }]),
  },
}));

vi.mock("@/lib/server/marketplace/product-rank", () => ({
  rankCatalogRows: mocks.rankCatalogRows,
}));

import { getCatalogProducts } from "@/lib/server/products";

function makeRow(id: string) {
  return {
    id,
    name: "Test",
    namePersian: "تست",
    price: 1000,
    image: "/img.jpg",
    category: "signet",
    metal: "sterling",
    stone: "turquoise",
    stoneShape: "round",
    engravingType: "none",
    availability: "ready",
    stock: 1,
    featured: false,
    bestseller: false,
    condition: "new",
    publicationStatus: "published",
    vendorId: null,
    collectionId: null,
    images: [],
    listing: { tier: "premium", headline: "headline", details: [] },
    preOwnedInfo: null,
    collection: null,
    vendor: null,
  };
}

describe("getCatalogProducts pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rankCatalogRows.mockImplementation(async (rows: unknown[]) => rows);
    mocks.productFindMany.mockResolvedValue([makeRow("p-1"), makeRow("p-2"), makeRow("p-3")]);
    mocks.productCount.mockResolvedValue(3);
  });

  it("returns full catalog when no limit is provided", async () => {
    const products = await getCatalogProducts();
    expect(products).toHaveLength(3);
  });

  it("returns the same count for offset 0 without limit as full catalog", async () => {
    const full = await getCatalogProducts();
    const offsetOnly = await getCatalogProducts({ offset: 0 });
    expect(offsetOnly).toHaveLength(full.length);
  });

  it("returns a paginated page when limit is set", async () => {
    mocks.productFindMany.mockResolvedValue([makeRow("p-1")]);
    const page = await getCatalogProducts({ limit: 1, offset: 0 });
    expect(page).toMatchObject({
      total: 3,
      limit: 1,
      offset: 0,
      hasMore: true,
    });
    expect((page as { products: unknown[] }).products).toHaveLength(1);
  });
});
