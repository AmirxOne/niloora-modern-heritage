import {
  matchesProductSearchQuery,
  searchProductsFuzzy,
} from "@/lib/catalog/product-catalog";
import { haloProduct, sampleProduct, soldProduct } from "../../fixtures/products";

const catalog = [sampleProduct, haloProduct, soldProduct];

describe("Product browsing — search", () => {
  it("matches Persian product names", () => {
    expect(matchesProductSearchQuery(sampleProduct, "تک‌نگین")).toBe(true);
    expect(matchesProductSearchQuery(sampleProduct, "xyz-not-found")).toBe(false);
  });

  it("matches stone labels in haystack", () => {
    expect(matchesProductSearchQuery(haloProduct, "یاقوت")).toBe(true);
  });

  it("returns fuzzy-ranked results for typos", () => {
    const results = searchProductsFuzzy(catalog, "هاله");
    expect(results.some((p) => p.id === haloProduct.id)).toBe(true);
  });

  it("returns empty array for blank query", () => {
    expect(searchProductsFuzzy(catalog, "   ")).toEqual([]);
  });
});
