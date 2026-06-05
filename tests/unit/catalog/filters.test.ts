import { applyShopFilters } from "@/lib/shop-filter-utils";
import {
  defaultShopFilters,
  haloProduct,
  sampleProduct,
  soldProduct,
} from "../../fixtures/products";

const catalog = [sampleProduct, haloProduct, soldProduct];

describe("Product browsing — shop filters", () => {
  it("returns full catalog with default filters", () => {
    expect(applyShopFilters(catalog, defaultShopFilters())).toHaveLength(3);
  });

  it("filters by ring style", () => {
    const filtered = applyShopFilters(
      catalog,
      defaultShopFilters({ styles: ["halo"] })
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(haloProduct.id);
  });

  it("filters by availability", () => {
    const filtered = applyShopFilters(
      catalog,
      defaultShopFilters({ availabilities: ["sold"] })
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(soldProduct.id);
  });

  it("filters by price range", () => {
    const filtered = applyShopFilters(
      catalog,
      defaultShopFilters({ priceRange: [0, 90_000_000] })
    );
    expect(filtered.map((p) => p.id)).toEqual([sampleProduct.id]);
  });

  it("filters by search query", () => {
    const filtered = applyShopFilters(
      catalog,
      defaultShopFilters({ query: "هاله" })
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(haloProduct.id);
  });

  it("filters featured collection flag", () => {
    const filtered = applyShopFilters(
      catalog,
      defaultShopFilters({ collections: ["featured"] })
    );
    expect(filtered.every((p) => p.featured)).toBe(true);
  });
});
