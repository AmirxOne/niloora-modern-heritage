import { describe, expect, it } from "vitest";
import { getProductCardSupplier } from "@/lib/marketplace/product-card-supplier";
import { fa } from "@/lib/i18n/fa";

describe("getProductCardSupplier", () => {
  it("returns vendor storefront when product has vendor", () => {
    expect(
      getProductCardSupplier({
        vendor: {
          id: "v1",
          slug: "atelier-ali",
          displayName: "Atelier Ali",
          displayNameFa: "آتلیه علی",
          status: "active",
        },
      })
    ).toEqual({
      name: "آتلیه علی",
      initial: "آ",
      href: "/vendor/atelier-ali",
      isPlatform: false,
    });
  });

  it("falls back to platform gallery for vendor-less products", () => {
    expect(getProductCardSupplier({})).toEqual({
      name: fa.shop.platformGallerySupplier,
      initial: fa.shop.platformGallerySupplier.charAt(0),
      href: "/shop",
      isPlatform: true,
    });
  });
});
