import { afterEach, describe, expect, it } from "vitest";
import {
  buildPublicCatalogProductWhere,
  mergePublicCatalogWhere,
} from "@/lib/server/marketplace/catalog-filter";

describe("catalog-filter", () => {
  afterEach(() => {
    delete process.env.ENABLE_MARKETPLACE_FILTER;
  });

  it("returns no extra filter when flag is OFF", () => {
    process.env.ENABLE_MARKETPLACE_FILTER = "false";
    expect(buildPublicCatalogProductWhere()).toBeUndefined();
    expect(mergePublicCatalogWhere({ featured: true })).toEqual({ featured: true });
  });

  it("keeps catalog where unchanged when flag is OFF (product count parity with pre-marketplace)", () => {
    process.env.ENABLE_MARKETPLACE_FILTER = "false";
    const unrestrictedWhere = mergePublicCatalogWhere();
    expect(unrestrictedWhere).toEqual({});

    process.env.ENABLE_MARKETPLACE_FILTER = "true";
    const restrictedWhere = mergePublicCatalogWhere();
    expect(restrictedWhere).toEqual({
      publicationStatus: "published",
      OR: [{ vendorId: null }, { vendor: { status: "active" } }],
    });
  });

  it("filters published products from active or platform vendors when flag is ON", () => {
    process.env.ENABLE_MARKETPLACE_FILTER = "true";
    expect(buildPublicCatalogProductWhere()).toEqual({
      publicationStatus: "published",
      OR: [{ vendorId: null }, { vendor: { status: "active" } }],
    });
  });

  it("merges base where with catalog filter when flag is ON", () => {
    process.env.ENABLE_MARKETPLACE_FILTER = "true";
    expect(mergePublicCatalogWhere({ condition: "new" })).toEqual({
      AND: [
        { condition: "new" },
        {
          publicationStatus: "published",
          OR: [{ vendorId: null }, { vendor: { status: "active" } }],
        },
      ],
    });
  });
});
