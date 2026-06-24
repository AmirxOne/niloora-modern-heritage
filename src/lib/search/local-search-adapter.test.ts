import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSearchProductDocument,
  localSearchAdapter,
  resetLocalSearchIndex,
} from "@/lib/search/local-search-adapter";

const sampleProduct = {
  id: "ring-1",
  name: "Royal Signet",
  namePersian: "انگشتر سلطنتی",
  listing: { tier: "premium" as const, headline: "انگشتر فیروزه", details: [] },
  price: 1_000_000,
  image: "/img.jpg",
  category: "signet" as const,
  metal: "sterling" as const,
  stone: "turquoise" as const,
  stoneShape: "round" as const,
  engravingType: "none" as const,
  availability: "ready" as const,
  stock: 1,
  featured: false,
  bestseller: false,
  condition: "new" as const,
};

describe("local search adapter", () => {
  beforeEach(() => {
    resetLocalSearchIndex();
  });

  it("returns indexed products for matching query", async () => {
    await localSearchAdapter.indexProduct(
      buildSearchProductDocument(sampleProduct, "انگشتر فیروزه سلطنتی")
    );

    const results = await localSearchAdapter.searchProducts("فیروزه");
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("ring-1");
  });

  it("removes products from the index", async () => {
    await localSearchAdapter.indexProduct(
      buildSearchProductDocument(sampleProduct, "انگشتر فیروزه")
    );
    await localSearchAdapter.removeProduct("ring-1");

    const results = await localSearchAdapter.searchProducts("فیروزه");
    expect(results).toHaveLength(0);
  });
});
