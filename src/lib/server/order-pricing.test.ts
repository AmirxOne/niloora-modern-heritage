import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultCustomizerState, calculateCustomizerPrice } from "@/lib/customizer-pricing";
import type { CartItem } from "@/lib/types";

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/server/products/validate-cart-purchase", () => ({
  validateCartPurchase: vi.fn(),
  CartPurchaseError: class CartPurchaseError extends Error {
    code?: string;
    productId?: string;
    constructor(message: string, options?: { code?: string; productId?: string }) {
      super(message);
      this.name = "CartPurchaseError";
      this.code = options?.code;
      this.productId = options?.productId;
    }
  },
}));

vi.mock("@/lib/server/promo/promo-code-service", () => ({
  calcPromoFromCode: vi.fn(),
}));

vi.mock("@/lib/server/home/home-banner", () => ({
  getSiteWideDiscountConfig: vi.fn(),
}));

import { prisma } from "@/lib/server/prisma";
import { validateCartPurchase } from "@/lib/server/products/validate-cart-purchase";
import { calcPromoFromCode } from "@/lib/server/promo/promo-code-service";
import { getSiteWideDiscountConfig } from "@/lib/server/home/home-banner";
import { repriceOrderItems } from "@/lib/server/order-pricing";

const dbProduct = {
  id: "prod-1",
  name: "انگشتر گالری",
  price: 5_000_000,
  listPrice: 6_000_000,
  discountPercent: null as number | null,
  image: "/catalog.jpg",
  availability: "ready" as const,
};

function catalogLine(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "line-catalog",
    productId: "prod-1",
    name: "نام جعلی کلاینت",
    price: 1,
    listPrice: 1,
    quantity: 1,
    image: "/fake.jpg",
    ...overrides,
  };
}

function customLine(clientPrice: number, state = defaultCustomizerState): CartItem {
  return {
    id: "line-custom",
    name: "طرح جعلی",
    price: clientPrice,
    listPrice: clientPrice,
    quantity: 1,
    image: "/fake.jpg",
    customizerState: state,
  };
}

describe("repriceOrderItems", () => {
  beforeEach(() => {
    vi.mocked(validateCartPurchase).mockResolvedValue(undefined);
    vi.mocked(prisma.product.findMany).mockResolvedValue([dbProduct]);
    vi.mocked(calcPromoFromCode).mockResolvedValue({
      amount: 0,
      normalizedCode: null,
      replacesSiteWide: false,
    });
    vi.mocked(getSiteWideDiscountConfig).mockResolvedValue({
      enabled: false,
      percent: 0,
      title: "",
      description: "",
    });
  });

  it("ignores client catalog prices and uses database pricing", async () => {
    const priced = await repriceOrderItems([catalogLine()], null);

    expect(priced.items[0].price).toBe(5_000_000);
    expect(priced.items[0].listPrice).toBe(6_000_000);
    expect(priced.items[0].name).toBe("انگشتر گالری");
    expect(priced.payable).toBe(5_000_000);
  });

  it("reprices custom design from server calculator, not client price", async () => {
    const expected = calculateCustomizerPrice(defaultCustomizerState);
    const priced = await repriceOrderItems([customLine(1)], null);

    expect(priced.items[0].price).toBe(expected);
    expect(priced.items[0].listPrice).toBe(expected);
    expect(priced.items[0].productId).toBeUndefined();
    expect(priced.items[0].customizerState).toBeDefined();
    expect(priced.payable).toBe(expected);
  });

  it("applies valid promo on repriced subtotal", async () => {
    vi.mocked(calcPromoFromCode).mockResolvedValueOnce({
      amount: 500_000,
      normalizedCode: "SAVE10",
      replacesSiteWide: false,
    });

    const priced = await repriceOrderItems([catalogLine()], "save10");

    expect(calcPromoFromCode).toHaveBeenCalledWith(5_000_000, "save10");
    expect(priced.promoCode).toBe("SAVE10");
    expect(priced.payable).toBe(4_500_000);
  });

  it("ignores invalid promo (no client-side trust)", async () => {
    vi.mocked(calcPromoFromCode).mockResolvedValueOnce({
      amount: 0,
      normalizedCode: null,
      replacesSiteWide: false,
    });

    const priced = await repriceOrderItems([catalogLine()], "FAKE99");

    expect(priced.promoCode).toBeNull();
    expect(priced.payable).toBe(5_000_000);
  });

  it("skips site-wide discount when promo replaces site-wide", async () => {
    vi.mocked(calcPromoFromCode).mockResolvedValueOnce({
      amount: 1_000_000,
      normalizedCode: "VIP",
      replacesSiteWide: true,
    });
    vi.mocked(getSiteWideDiscountConfig).mockResolvedValueOnce({
      enabled: true,
      percent: 10,
      title: "جشنواره",
      description: "",
    });

    const priced = await repriceOrderItems([catalogLine()], "vip");

    expect(priced.payable).toBe(4_000_000);
    expect(priced.totalFurooh).toBe(2_000_000);
  });

  it("combines product furooh, promo, and site-wide on mixed cart", async () => {
    const customPrice = calculateCustomizerPrice(defaultCustomizerState);
    vi.mocked(calcPromoFromCode).mockResolvedValueOnce({
      amount: 200_000,
      normalizedCode: "SAVE20",
      replacesSiteWide: false,
    });
    vi.mocked(getSiteWideDiscountConfig).mockResolvedValueOnce({
      enabled: true,
      percent: 10,
      title: "جشنواره",
      description: "",
    });

    const priced = await repriceOrderItems(
      [catalogLine(), customLine(999)],
      "save20"
    );

    const subtotalSale = 5_000_000 + customPrice;
    const afterPromo = subtotalSale - 200_000;
    const siteWide = Math.round(afterPromo * 0.1);
    expect(priced.payable).toBe(subtotalSale - 200_000 - siteWide);
    expect(priced.items).toHaveLength(2);
  });

  it("rejects lines without product or customizer config", async () => {
    await expect(
      repriceOrderItems(
        [
          {
            id: "orphan",
            name: "بدون مرجع",
            price: 1_000_000,
            quantity: 1,
            image: "/x.jpg",
          },
        ],
        null
      )
    ).rejects.toThrow("قلم سبد باید محصول گالری یا طرح سفارشی باشد");
  });
});
