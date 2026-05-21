import { describe, expect, it } from "vitest";
import {
  calcPromoDiscountAmount,
  normalizePromoCode,
  validatePromoDefinition,
} from "@/lib/server/promo/promo-code";
import type { PromoCodeDefinition } from "@/lib/types";

const promo: PromoCodeDefinition = {
  id: "1",
  code: "SAVE20",
  label: "۲۰٪",
  type: "percent",
  value: 20,
  minSubtotal: 1_000_000,
  replacesSiteWide: false,
};

describe("normalizePromoCode", () => {
  it("uppercases and strips spaces", () => {
    expect(normalizePromoCode("  gold 10 ")).toBe("GOLD10");
  });
});

describe("validatePromoDefinition", () => {
  it("accepts active promo above minimum", () => {
    expect(validatePromoDefinition(promo, 2_000_000, true)).toEqual({
      ok: true,
      promo,
    });
  });

  it("rejects below minimum subtotal", () => {
    expect(validatePromoDefinition(promo, 500_000, true)).toEqual({
      ok: false,
      reason: "min_order",
    });
  });

  it("rejects inactive codes", () => {
    expect(validatePromoDefinition(promo, 2_000_000, false)).toEqual({
      ok: false,
      reason: "inactive",
    });
  });
});

describe("calcPromoDiscountAmount", () => {
  it("caps fixed discount at subtotal", () => {
    const fixed: PromoCodeDefinition = {
      ...promo,
      type: "fixed",
      value: 5_000_000,
    };
    expect(calcPromoDiscountAmount(1_000_000, fixed)).toBe(1_000_000);
  });

  it("rounds percent discount", () => {
    expect(calcPromoDiscountAmount(1_500_000, promo)).toBe(300_000);
  });
});
