import { describe, expect, it } from "vitest";
import { mapProductMarketplaceFields } from "@/lib/server/marketplace/map-product-marketplace-fields";

describe("mapProductMarketplaceFields", () => {
  it("maps platform-owned published product", () => {
    expect(
      mapProductMarketplaceFields({
        vendorId: null,
        publicationStatus: "published",
      })
    ).toEqual({ publicationStatus: "published" });
  });

  it("maps vendor-owned draft product", () => {
    expect(
      mapProductMarketplaceFields({
        vendorId: "vendor-1",
        publicationStatus: "draft",
      })
    ).toEqual({ vendorId: "vendor-1", publicationStatus: "draft" });
  });

  it("ignores unknown publication status values", () => {
    expect(
      mapProductMarketplaceFields({
        vendorId: null,
        publicationStatus: "invalid",
      })
    ).toEqual({});
  });
});
