import { describe, expect, it } from "vitest";
import {
  getCatalogMaxPrice,
  matchesProductSearchQuery,
  normalizeCatalogProductPricing,
} from "@/lib/catalog/product-catalog";
import type { Product } from "@/lib/types";

const sample: Product = {
  id: "sample",
  name: "تک‌نگین الماس «شیراز»",
  namePersian: "مجموعه میراث سلطنتی",
  listing: {
    tier: "premium",
    headline: "انگشتر نقره مردانه",
    details: ["رکاب استرلینگ", "الماس تک‌نگین گرد"],
  },
  price: 124_000_000,
  listPrice: 155_000_000,
  discountPercent: 20,
  image: "/img.jpg",
  category: "solitaire",
  metal: "sterling",
  stone: "diamond",
  stoneShape: "round",
  engravingType: "nastaliq",
  availability: "ready",
  stock: 1,
  featured: true,
  bestseller: true,
  collection: "Royal Heritage",
  collectionId: "royal-heritage",
  initialSalesCount: 10,
  condition: "new",
};

describe("normalizeCatalogProductPricing", () => {
  it("aligns sale price with getProductPricing rules", () => {
    const normalized = normalizeCatalogProductPricing({
      price: 124_000_000,
      listPrice: 155_000_000,
      discountPercent: 20,
    });
    expect(normalized.price).toBe(124_000_000);
    expect(normalized.listPrice).toBe(155_000_000);
    expect(normalized.discountPercent).toBe(20);
  });

  it("clears discount fields when there is no furooh", () => {
    const normalized = normalizeCatalogProductPricing({
      price: 50_000_000,
      listPrice: 50_000_000,
      discountPercent: 0,
    });
    expect(normalized.price).toBe(50_000_000);
    expect(normalized.listPrice).toBeUndefined();
    expect(normalized.discountPercent).toBeUndefined();
  });
});

describe("matchesProductSearchQuery", () => {
  it("matches name, headline, and details like shop filters", () => {
    expect(matchesProductSearchQuery(sample, "شیراز")).toBe(true);
    expect(matchesProductSearchQuery(sample, "انگشتر نقره")).toBe(true);
    expect(matchesProductSearchQuery(sample, "استرلینگ")).toBe(true);
    expect(matchesProductSearchQuery(sample, "یافت نشد")).toBe(false);
  });
});

describe("getCatalogMaxPrice", () => {
  it("returns max sale price from catalog", () => {
    expect(getCatalogMaxPrice([{ price: 10 }, { price: 50 }, { price: 30 }])).toBe(50);
    expect(getCatalogMaxPrice([])).toBe(0);
  });
});
