import { describe, expect, it } from "vitest";
import { getProductDisplayName, stripProductTypePrefix } from "@/lib/products/product-display-name";

describe("stripProductTypePrefix", () => {
  it("removes ring-men prefix", () => {
    expect(stripProductTypePrefix("انگشتر مردانه - عقیق یمن")).toBe("عقیق یمن");
    expect(stripProductTypePrefix("انگشتر مردانه – عقیق سرخ یمن")).toBe("عقیق سرخ یمن");
  });

  it("removes other product type prefixes", () => {
    expect(stripProductTypePrefix("گردنبند - عقیق سبز")).toBe("عقیق سبز");
    expect(stripProductTypePrefix("تسبیح - عقیق سیاه")).toBe("عقیق سیاه");
  });

  it("returns unchanged when no prefix matches", () => {
    expect(stripProductTypePrefix("عقیق یمن")).toBe("عقیق یمن");
  });
});

describe("getProductDisplayName", () => {
  it("strips prefix from persian name", () => {
    expect(
      getProductDisplayName({
        id: "NL-RGM-7166",
        name: "Men Ring - Yemen Aqeeq",
        namePersian: "انگشتر مردانه - عقیق یمن",
        productType: "ring-men",
      })
    ).toBe("عقیق یمن");
  });
});
