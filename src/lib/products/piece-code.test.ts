import { describe, expect, it } from "vitest";
import {
  resolvePieceCode,
  parsePieceCode,
  normalizePieceCode,
  isValidPieceCode,
  findProductByPieceCode,
  productTypeFromCode,
  PRODUCT_TYPE_CODES,
  pieceCodeToFarsiDigits,
} from "@/lib/products/piece-code";
import type { Product, ProductType } from "@/lib/types";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: "test-ring",
    name: "Test Ring",
    namePersian: "انگشتر تست",
    listing: "standard" as Product["listing"],
    price: 0,
    image: "/test.jpg",
    category: "solitaire",
    metal: "sterling",
    stone: "diamond" as Product["stone"],
    stoneShape: "round" as Product["stoneShape"],
    engravingType: "none",
    availability: "ready",
    stock: 1,
    featured: false,
    bestseller: false,
    condition: "new",
    ...overrides,
  };
}

describe("piece-code", () => {
  it("هر نوع اثر در PRODUCT_TYPE_CODES کد ۳-حرفی منحصربه‌فرد دارد", () => {
    const codes = Object.values(PRODUCT_TYPE_CODES).map((v) => v.code);
    const set = new Set(codes);
    expect(set.size).toBe(codes.length);
    for (const c of codes) {
      expect(c).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("کد یک محصول بدون pieceCode، قطعی و یکسان است", () => {
    const p = makeProduct({ id: "shiraz-solitaire", productType: "ring-men" });
    const a = resolvePieceCode(p);
    const b = resolvePieceCode(p);
    expect(a).toBe(b);
    expect(a).toMatch(/^NL-RGM-\d{4}$/);
  });

  it("دو محصول متفاوت معمولاً کد متفاوت می‌گیرند", () => {
    const a = resolvePieceCode(makeProduct({ id: "alpha" }));
    const b = resolvePieceCode(makeProduct({ id: "beta" }));
    expect(a).not.toBe(b);
  });

  it("pieceCode اختصاصی روی الگوی auto اولویت دارد", () => {
    const p = makeProduct({ id: "x", pieceCode: "NL-RGM-9999" });
    expect(resolvePieceCode(p)).toBe("NL-RGM-9999");
  });

  it("نوع اثر روی کد تأثیر دارد", () => {
    const ring = makeProduct({ id: "x", productType: "ring-men" });
    const necklace = makeProduct({ id: "x", productType: "necklace" });
    expect(resolvePieceCode(ring)).toMatch(/^NL-RGM-/);
    expect(resolvePieceCode(necklace)).toMatch(/^NL-NCK-/);
  });

  it("normalizePieceCode ارقام فارسی و فاصله را پاک می‌کند", () => {
    expect(normalizePieceCode("nl rgm ۰۰۴۲")).toBe("NL-RGM-0042");
    expect(normalizePieceCode("nl_rgm.0042")).toBe("NL-RGM-0042");
    expect(normalizePieceCode("NL-RGM-0042")).toBe("NL-RGM-0042");
  });

  it("parsePieceCode اجزای کد را برمی‌گرداند", () => {
    const parts = parsePieceCode("nl-rgm-0042");
    expect(parts).not.toBeNull();
    expect(parts!.brand).toBe("NL");
    expect(parts!.typeCode).toBe("RGM");
    expect(parts!.productType).toBe<ProductType>("ring-men");
    expect(parts!.sequence).toBe("0042");
  });

  it("کد نامعتبر، null برمی‌گرداند", () => {
    expect(parsePieceCode("ABC-XYZ-12")).toBeNull();
    expect(parsePieceCode("")).toBeNull();
    expect(isValidPieceCode("NL-RGM-12345")).toBe(false);
  });

  it("productTypeFromCode مپ معکوس درست انجام می‌دهد", () => {
    expect(productTypeFromCode("rgm")).toBe<ProductType>("ring-men");
    expect(productTypeFromCode("TSB")).toBe<ProductType>("tasbih");
    expect(productTypeFromCode("ZZZ")).toBeNull();
  });

  it("findProductByPieceCode محصول را با کد اعلام‌شده پیدا می‌کند (با تحمل فرمت)", () => {
    const products: Product[] = [
      makeProduct({ id: "a" }),
      makeProduct({ id: "b" }),
      makeProduct({ id: "c", pieceCode: "NL-NCK-1234" }),
    ];
    const codeForB = resolvePieceCode(products[1]!);
    expect(findProductByPieceCode(products, codeForB)?.id).toBe("b");
    expect(findProductByPieceCode(products, codeForB.toLowerCase())?.id).toBe("b");
    expect(findProductByPieceCode(products, "nl_nck.1234")?.id).toBe("c");
    expect(findProductByPieceCode(products, "NL-RGM-0000")).toBeNull();
  });

  it("pieceCodeToFarsiDigits فقط رقم‌ها را به فارسی تبدیل می‌کند", () => {
    expect(pieceCodeToFarsiDigits("NL-RGM-0042")).toBe("NL-RGM-۰۰۴۲");
  });
});
