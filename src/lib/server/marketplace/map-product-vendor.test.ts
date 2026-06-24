import { describe, expect, it } from "vitest";
import {
  mapProductVendorSummary,
  resolveOrderItemVendorId,
} from "@/lib/server/marketplace/map-product-vendor";

describe("mapProductVendorSummary", () => {
  it("returns undefined when vendor is null", () => {
    expect(mapProductVendorSummary(null)).toBeUndefined();
  });

  it("maps vendor summary fields", () => {
    expect(
      mapProductVendorSummary({
        id: "v1",
        slug: "atelier-ali",
        displayName: "Atelier Ali",
        displayNameFa: "آتلیه علی",
        status: "active",
      })
    ).toEqual({
      id: "v1",
      slug: "atelier-ali",
      displayName: "Atelier Ali",
      displayNameFa: "آتلیه علی",
      status: "active",
    });
  });
});

describe("resolveOrderItemVendorId", () => {
  it("returns null for platform-owned products and legacy rows without vendorId", () => {
    expect(resolveOrderItemVendorId(null)).toBeNull();
    expect(resolveOrderItemVendorId(undefined)).toBeNull();
  });

  it("preserves vendor id for marketplace items", () => {
    expect(resolveOrderItemVendorId("vendor-42")).toBe("vendor-42");
  });
});
