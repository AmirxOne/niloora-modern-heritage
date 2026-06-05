import { getProductStatusConfig } from "@/lib/product-status";

describe("Product browsing — availability status", () => {
  it("allows add-to-cart for ready items", () => {
    const config = getProductStatusConfig("ready");
    expect(config.canAddToCart).toBe(true);
    expect(config.tone).toBe("ready");
  });

  it("disallows add-to-cart for sold items", () => {
    const config = getProductStatusConfig("sold");
    expect(config.canAddToCart).toBe(false);
    expect(config.tone).toBe("sold");
  });

  it("exposes Persian labels", () => {
    const config = getProductStatusConfig("preorder");
    expect(config.label.length).toBeGreaterThan(0);
    expect(config.shortLabel.length).toBeGreaterThan(0);
  });
});
