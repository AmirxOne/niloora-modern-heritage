import { afterEach, describe, expect, it } from "vitest";
import {
  computeProductRankScore,
  sortProductsByRankScore,
  type ProductRankInput,
} from "@/lib/server/marketplace/product-rank";

const now = new Date("2026-06-24T12:00:00Z");

function makeInput(overrides: Partial<ProductRankInput> = {}): ProductRankInput {
  return {
    id: overrides.id ?? "prod-1",
    createdAt: overrides.createdAt ?? new Date("2026-06-01T12:00:00Z"),
    initialSalesCount: overrides.initialSalesCount ?? 0,
    featured: overrides.featured ?? false,
    bestseller: overrides.bestseller ?? false,
    stock: overrides.stock ?? 1,
    vendorTrust: overrides.vendorTrust,
  };
}

describe("product-rank", () => {
  afterEach(() => {
    delete process.env.ENABLE_MARKETPLACE_RANKING;
  });

  it("boosts newer products with cold-start bonus", () => {
    const newer = computeProductRankScore(
      makeInput({ id: "new", createdAt: new Date("2026-06-20T12:00:00Z") }),
      now
    );
    const older = computeProductRankScore(
      makeInput({ id: "old", createdAt: new Date("2026-01-01T12:00:00Z") }),
      now
    );
    expect(newer).toBeGreaterThan(older);
  });

  it("preserves input order when ranking flag is OFF", () => {
    process.env.ENABLE_MARKETPLACE_RANKING = "false";

    const products = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const rankInputs = new Map<string, ProductRankInput>([
      ["a", makeInput({ id: "a", featured: false })],
      ["b", makeInput({ id: "b", featured: true })],
      ["c", makeInput({ id: "c", bestseller: true })],
    ]);

    const sorted = sortProductsByRankScore(products, rankInputs, now);
    expect(sorted.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("reorders products when ranking flag is ON", () => {
    process.env.ENABLE_MARKETPLACE_RANKING = "true";

    const products = [{ id: "a" }, { id: "b" }];
    const rankInputs = new Map<string, ProductRankInput>([
      ["a", makeInput({ id: "a", featured: false, stock: 0 })],
      ["b", makeInput({ id: "b", featured: true, stock: 5, initialSalesCount: 100 })],
    ]);

    const sorted = sortProductsByRankScore(products, rankInputs, now);
    expect(sorted[0]?.id).toBe("b");
  });
});
