import { describe, expect, it } from "vitest";
import { validateVendorProductInput } from "@/lib/vendor/vendor-product-validation";

describe("vendor-product-validation", () => {
  it("accepts valid create payload", () => {
    const result = validateVendorProductInput(
      {
        name: "Ring A",
        namePersian: "انگشتر A",
        image: "/uploads/vendor-media/v1/a.webp",
        price: 1200000,
        stock: 2,
        category: "signet",
        metal: "sterling",
        stone: "turquoise",
      },
      "create"
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.price).toBe(1200000);
      expect(result.data.stock).toBe(2);
    }
  });

  it("rejects create payload with missing required fields", () => {
    const result = validateVendorProductInput({ name: "Only Name" }, "create");
    expect(result.ok).toBe(false);
  });

  it("rejects invalid price and stock constraints", () => {
    const badPrice = validateVendorProductInput(
      {
        name: "Ring A",
        namePersian: "انگشتر A",
        image: "/uploads/vendor-media/v1/a.webp",
        price: -1,
      },
      "create"
    );
    expect(badPrice.ok).toBe(false);

    const badStock = validateVendorProductInput(
      {
        name: "Ring A",
        namePersian: "انگشتر A",
        image: "/uploads/vendor-media/v1/a.webp",
        price: 1000,
        stock: 200000,
      },
      "create"
    );
    expect(badStock.ok).toBe(false);
  });

  it("rejects empty update payload", () => {
    const result = validateVendorProductInput({}, "update");
    expect(result.ok).toBe(false);
  });

  it("accepts partial update with normalized fields", () => {
    const result = validateVendorProductInput(
      {
        name: " Ring B ",
        listingHeadline: "  New Headline  ",
      },
      "update"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Ring B");
      expect(result.data.listingHeadline).toBe("New Headline");
    }
  });
});
