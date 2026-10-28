import { describe, expect, it } from "vitest";
import { normalizePersianSearch } from "@/lib/persian-normalize";

describe("normalizePersianSearch", () => {
  it("unifies Arabic ye/kaf to Persian", () => {
    expect(normalizePersianSearch("علي")).toBe("علی");
    expect(normalizePersianSearch("كتاب")).toBe("کتاب");
  });

  it("strips Arabic diacritics", () => {
    expect(normalizePersianSearch("مُحَمَّد")).toBe("محمد");
  });

  it("removes zero-width chars (نیم‌فاصله)", () => {
    expect(normalizePersianSearch("می‌روم")).toBe("میروم");
    expect(normalizePersianSearch("نیم\u200cفاصله")).toBe("نیمفاصله");
  });

  it("unifies Persian and Arabic digits to latin", () => {
    expect(normalizePersianSearch("۱۲۳")).toBe("123");
    expect(normalizePersianSearch("٤٥٦")).toBe("456");
  });

  it("lowercases latin and collapses whitespace", () => {
    expect(normalizePersianSearch("  Silver   Ring  ")).toBe("silver ring");
  });

  it("matching works across Arabic/Persian variants", () => {
    const data = normalizePersianSearch("انگشتر یکتا");
    const arabicQuery = normalizePersianSearch("يکتا".replace(/ی/g, "ي"));
    expect(data.includes(arabicQuery)).toBe(true);
  });

  it("does not alter latin identifiers", () => {
    expect(normalizePersianSearch("SKU-123abc")).toBe("sku-123abc");
  });
});
