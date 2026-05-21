import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultCustomizerState } from "@/lib/customizer-pricing";
import type { CartItem } from "@/lib/types";

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/server/prisma";
import { sanitizeCartItems } from "@/lib/server/cart/sanitize-cart";

const catalogLine = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "line-1",
  productId: "prod-1",
  name: "قدیمی",
  price: 1,
  quantity: 1,
  image: "/x.jpg",
  availability: "ready",
  ...overrides,
});

describe("sanitizeCartItems", () => {
  beforeEach(() => {
    vi.mocked(prisma.product.findMany).mockClear();
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-1",
        name: "Ring",
        namePersian: "انگشتر",
        price: 2_000_000,
        listPrice: 2_500_000,
        discountPercent: null,
        image: "/db.jpg",
        availability: "ready",
        stock: 3,
      },
    ] as Awaited<ReturnType<typeof prisma.product.findMany>>);
  });

  it("removes lines for missing products", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);
    const result = await sanitizeCartItems([catalogLine()]);
    expect(result.items).toHaveLength(0);
    expect(result.removed[0].reason).toBe("not_found");
  });

  it("removes sold products", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      {
        id: "prod-1",
        name: "Ring",
        namePersian: "انگشتر",
        price: 2_000_000,
        listPrice: 2_500_000,
        discountPercent: null,
        image: "/db.jpg",
        availability: "sold",
        stock: 0,
      },
    ] as Awaited<ReturnType<typeof prisma.product.findMany>>);

    const result = await sanitizeCartItems([catalogLine()]);
    expect(result.removed[0].reason).toBe("sold");
    expect(result.items).toHaveLength(0);
  });

  it("reprices surviving lines from database", async () => {
    const result = await sanitizeCartItems([catalogLine({ price: 1, name: "جعلی" })]);
    expect(result.items[0].price).toBe(2_000_000);
    expect(result.items[0].name).toBe("انگشتر");
  });

  it("keeps custom design lines without product lookup", async () => {
    const custom: CartItem = {
      id: "custom-1",
      name: "طرح من",
      price: 50_000_000,
      quantity: 1,
      image: "/c.jpg",
      customizerState: defaultCustomizerState,
    };
    const result = await sanitizeCartItems([custom]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].price).toBe(50_000_000);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(result.removed).toHaveLength(0);
  });
});
