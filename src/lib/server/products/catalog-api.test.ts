import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCatalogProducts: vi.fn(),
  getCatalogMaxPrice: vi.fn(),
  getCatalogMaxPriceFromDb: vi.fn(),
}));

vi.mock("@/lib/server/products", () => ({
  getCatalogProducts: mocks.getCatalogProducts,
  getCatalogMaxPrice: mocks.getCatalogMaxPrice,
  getCatalogMaxPriceFromDb: mocks.getCatalogMaxPriceFromDb,
}));

import { handleCatalogProductsGet } from "@/lib/server/products/catalog-api";

describe("GET /api/products pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCatalogMaxPrice.mockReturnValue(100_000);
    mocks.getCatalogMaxPriceFromDb.mockResolvedValue(100_000);
  });

  it("returns paginated payload for limit=24", async () => {
    mocks.getCatalogProducts.mockResolvedValue({
      products: [{ id: "p-1" }],
      total: 50,
      limit: 24,
      offset: 0,
      hasMore: true,
      nextCursor: "p-1",
    });

    const response = await handleCatalogProductsGet(
      new Request("http://localhost/api/products?limit=24&offset=0")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.products).toHaveLength(1);
    expect(body.total).toBe(50);
    expect(body.limit).toBe(24);
  });

  it("returns legacy full payload without limit", async () => {
    mocks.getCatalogProducts.mockResolvedValue([{ id: "p-1" }, { id: "p-2" }]);

    const response = await handleCatalogProductsGet(new Request("http://localhost/api/products"));
    const body = await response.json();

    expect(body.products).toHaveLength(2);
    expect(body.maxPrice).toBe(100_000);
    expect(body.total).toBeUndefined();
  });
});
