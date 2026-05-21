import { describe, expect, it } from "vitest";
import { calculateCartPricing, getProductPricing } from "@/lib/pricing";
import type { CartItem, PromoCodeDefinition } from "@/lib/types";

const basePromo: PromoCodeDefinition = {
  id: "p1",
  code: "GOLD10",
  label: "۱۰٪",
  type: "percent",
  value: 10,
  minSubtotal: 500_000,
  replacesSiteWide: false,
};

function cartLine(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "line-1",
    productId: "prod-1",
    name: "Ring",
    price: 1_000_000,
    listPrice: 1_200_000,
    quantity: 1,
    image: "/ring.jpg",
    ...overrides,
  };
}

describe("getProductPricing", () => {
  it("applies percent discount from list price", () => {
    const pricing = getProductPricing({
      price: 900_000,
      listPrice: 1_000_000,
      discountPercent: 10,
    });
    expect(pricing.listPrice).toBe(1_000_000);
    expect(pricing.salePrice).toBe(900_000);
    expect(pricing.productFurooh).toBe(100_000);
  });

  it("never prices sale above list", () => {
    const pricing = getProductPricing({
      price: 2_000_000,
      listPrice: 1_000_000,
      discountPercent: 0,
    });
    expect(pricing.salePrice).toBe(1_000_000);
  });
});

describe("calculateCartPricing", () => {
  it("sums lines and product furooh", () => {
    const breakdown = calculateCartPricing(
      [cartLine({ quantity: 2 })],
      null,
      null,
      { enabled: false, percent: 0 }
    );
    expect(breakdown.subtotalSale).toBe(2_000_000);
    expect(breakdown.subtotalList).toBe(2_400_000);
    expect(breakdown.productFurooh).toBe(400_000);
    expect(breakdown.payable).toBe(2_000_000);
  });

  it("applies percent promo then site-wide on remainder", () => {
    const breakdown = calculateCartPricing(
      [cartLine()],
      basePromo,
      "GOLD10",
      { enabled: true, percent: 5 }
    );
    expect(breakdown.promoFurooh).toBe(100_000);
    expect(breakdown.siteWideFurooh).toBe(45_000);
    expect(breakdown.checkoutFurooh).toBe(145_000);
    expect(breakdown.payable).toBe(855_000);
  });

  it("skips site-wide when promo replaces it", () => {
    const promo: PromoCodeDefinition = { ...basePromo, replacesSiteWide: true };
    const breakdown = calculateCartPricing(
      [cartLine()],
      promo,
      "VIP",
      { enabled: true, percent: 10 }
    );
    expect(breakdown.siteWideFurooh).toBe(0);
    expect(breakdown.promoFurooh).toBe(100_000);
    expect(breakdown.payable).toBe(900_000);
  });

  it("ignores promo below minimum subtotal", () => {
    const breakdown = calculateCartPricing(
      [cartLine({ price: 100_000, listPrice: 100_000 })],
      basePromo,
      "GOLD10",
      { enabled: false, percent: 0 }
    );
    expect(breakdown.appliedPromo).toBeNull();
    expect(breakdown.promoFurooh).toBe(0);
  });
});
