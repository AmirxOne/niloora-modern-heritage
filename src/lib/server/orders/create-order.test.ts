import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CartItem } from "@/lib/types";

vi.mock("@/lib/server/order-pricing", () => ({
  repriceOrderItems: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    order: {
      create: vi.fn(),
    },
  },
}));

import { computeShippingCost } from "@/lib/orders/shipping-cost";
import { repriceOrderItems } from "@/lib/server/order-pricing";
import { prisma } from "@/lib/server/prisma";
import { createOrderFromCart, createOrderId } from "@/lib/server/orders/create-order";

const shipping: CheckoutShippingInput = {
  fullName: "کاربر تست",
  mobile: "09121234567",
  email: "",
  province: "تهران",
  city: "تهران",
  address: "خیابان ولیعصر، پلاک ۱۰",
  postalCode: "1234567890",
  orderNote: "",
  shippingMethod: "standard",
};

const cartItem: CartItem = {
  id: "line-1",
  productId: "prod-1",
  name: "انگشتر تست",
  price: 1_000_000,
  listPrice: 1_100_000,
  quantity: 1,
  image: "/img.jpg",
};

describe("createOrderId", () => {
  it("generates HS-prefixed ids", () => {
    expect(createOrderId()).toMatch(/^HS-[A-Z0-9]+$/);
  });
});

describe("createOrderFromCart", () => {
  beforeEach(() => {
    vi.mocked(repriceOrderItems).mockResolvedValue({
      items: [cartItem],
      subtotalList: 1_100_000,
      subtotalSale: 1_000_000,
      totalFurooh: 100_000,
      payable: 1_000_000,
      promoCode: "GOLD10",
    });

    vi.mocked(prisma.order.create).mockResolvedValue({
      id: "HS-TEST123",
      userId: "user-1",
      status: "pending_payment",
      total: 1_050_000,
      subtotalList: 1_100_000,
      totalFurooh: 100_000,
      promoCode: "GOLD10",
      shippingCost: 50_000,
      items: [{ ...cartItem, orderId: "HS-TEST123" }],
    } as Awaited<ReturnType<typeof prisma.order.create>>);
  });

  it("persists order with shipping and priced lines", async () => {
    const shippingCost = computeShippingCost({
      province: shipping.province,
      city: shipping.city,
      shippingMethod: shipping.shippingMethod,
    }).cost;
    const expectedTotal = 1_000_000 + shippingCost;

    const result = await createOrderFromCart({
      userId: "user-1",
      items: [cartItem],
      promoCode: "gold10",
      status: "pending_payment",
      shipping,
    });

    expect(repriceOrderItems).toHaveBeenCalledWith([cartItem], "gold10");
    expect(prisma.order.create).toHaveBeenCalledOnce();

    const createArg = vi.mocked(prisma.order.create).mock.calls[0][0];
    expect(createArg.data.userId).toBe("user-1");
    expect(createArg.data.status).toBe("pending_payment");
    expect(createArg.data.total).toBe(expectedTotal);
    expect(createArg.data.promoCode).toBe("GOLD10");
    expect(createArg.data.shippingPhone).toBe("09121234567");
    expect(createArg.data.items?.create).toHaveLength(1);

    expect(result.orderTotal).toBe(expectedTotal);
    expect(result.shippingCost).toBe(shippingCost);
  });

  it("rejects empty payable cart", async () => {
    vi.mocked(repriceOrderItems).mockResolvedValueOnce({
      items: [],
      subtotalList: 0,
      subtotalSale: 0,
      totalFurooh: 0,
      payable: 0,
      promoCode: null,
    });

    await expect(
      createOrderFromCart({
        userId: "user-1",
        items: [],
        promoCode: null,
        status: "pending_payment",
        shipping,
      })
    ).rejects.toThrow("Invalid order payload");
  });
});
