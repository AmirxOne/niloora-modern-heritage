import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CartItem } from "@/lib/types";

const { orderCreate, recordCampaignUsageMock, productFindMany } = vi.hoisted(() => ({
  orderCreate: vi.fn(),
  recordCampaignUsageMock: vi.fn(),
  productFindMany: vi.fn(),
}));

vi.mock("@/lib/server/order-pricing", () => ({
  repriceOrderItems: vi.fn(),
}));

vi.mock("@/lib/server/campaigns/discount-campaign-service", () => ({
  recordCampaignUsage: recordCampaignUsageMock,
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    order: {
      create: orderCreate,
    },
    $transaction: vi.fn(
      async (
        callback: (tx: {
          order: { create: typeof orderCreate };
          product: { findMany: typeof productFindMany };
        }) => unknown
      ) =>
        callback({
          order: { create: orderCreate },
          product: { findMany: productFindMany },
        })
    ),
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
    vi.clearAllMocks();
    productFindMany.mockResolvedValue([{ id: "prod-1", vendorId: null }]);

    vi.mocked(repriceOrderItems).mockResolvedValue({
      items: [cartItem],
      subtotalList: 1_100_000,
      subtotalSale: 1_000_000,
      totalFurooh: 100_000,
      payable: 1_000_000,
      promoCode: "GOLD10",
      loyaltyTier: "bronze",
      loyaltyDiscountAmount: 0,
      loyaltyPointsEarned: 10,
      bundleDiscount: 0,
      appliedBundles: [],
      campaignId: null,
      campaignSlug: null,
      campaignTitle: null,
      campaignDiscountAmount: 0,
    });

    vi.mocked(orderCreate).mockResolvedValue({
      id: "HS-TEST123",
      userId: "user-1",
      status: "pending_payment",
      total: 1_050_000,
      subtotalList: 1_100_000,
      totalFurooh: 100_000,
      promoCode: "GOLD10",
      shippingCost: 50_000,
      items: [{ ...cartItem, orderId: "HS-TEST123" }],
    } as Awaited<ReturnType<typeof orderCreate>>);
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

    expect(repriceOrderItems).toHaveBeenCalledWith([cartItem], "gold10", {
      loyaltyTier: undefined,
    });
    expect(orderCreate).toHaveBeenCalledOnce();

    const createArg = vi.mocked(orderCreate).mock.calls[0][0];
    expect(createArg.data.userId).toBe("user-1");
    expect(createArg.data.status).toBe("pending_payment");
    expect(createArg.data.total).toBe(expectedTotal);
    expect(createArg.data.promoCode).toBe("GOLD10");
    expect(createArg.data.shippingPhone).toBe("09121234567");
    expect(createArg.data.items?.create).toHaveLength(1);

    expect(result.orderTotal).toBe(expectedTotal);
    expect(result.shippingCost).toBe(shippingCost);
  });

  it("copies product vendorId onto order items", async () => {
    productFindMany.mockImplementationOnce(async () => [
      { id: "prod-1", vendorId: "vendor-99" },
    ]);

    await createOrderFromCart({
      userId: "user-1",
      items: [cartItem],
      promoCode: null,
      status: "pending_payment",
      shipping,
    });

    const createArg = vi.mocked(orderCreate).mock.calls[0][0];
    expect(createArg.data.items?.create?.[0]?.vendorId).toBe("vendor-99");
  });

  it("persists mixed vendor and platform lines in one order with correct vendorIds", async () => {
    const platformLine: CartItem = {
      ...cartItem,
      id: "line-platform",
      productId: "prod-platform",
      name: "اثر پلتفرم",
    };
    const vendorLine: CartItem = {
      ...cartItem,
      id: "line-vendor",
      productId: "prod-vendor",
      name: "اثر فروشنده",
    };

    productFindMany.mockResolvedValueOnce([
      { id: "prod-platform", vendorId: null },
      { id: "prod-vendor", vendorId: "vendor-a" },
    ]);

    vi.mocked(repriceOrderItems).mockResolvedValueOnce({
      items: [platformLine, vendorLine],
      subtotalList: 2_200_000,
      subtotalSale: 2_000_000,
      totalFurooh: 200_000,
      payable: 2_000_000,
      promoCode: null,
      loyaltyTier: "bronze",
      loyaltyDiscountAmount: 0,
      loyaltyPointsEarned: 20,
      bundleDiscount: 0,
      appliedBundles: [],
      campaignId: null,
      campaignSlug: null,
      campaignTitle: null,
      campaignDiscountAmount: 0,
    });

    await createOrderFromCart({
      userId: "user-1",
      items: [platformLine, vendorLine],
      promoCode: null,
      status: "pending_payment",
      shipping,
    });

    const createdItems = vi.mocked(orderCreate).mock.calls[0][0].data.items?.create;
    expect(createdItems).toHaveLength(2);
    expect(createdItems?.find((item) => item.productId === "prod-platform")?.vendorId).toBeNull();
    expect(createdItems?.find((item) => item.productId === "prod-vendor")?.vendorId).toBe(
      "vendor-a"
    );
  });

  it("records campaign usage inside the order transaction", async () => {
    vi.mocked(repriceOrderItems).mockResolvedValueOnce({
      items: [cartItem],
      subtotalList: 1_100_000,
      subtotalSale: 1_000_000,
      totalFurooh: 100_000,
      payable: 1_000_000,
      promoCode: null,
      loyaltyTier: "bronze",
      loyaltyDiscountAmount: 0,
      loyaltyPointsEarned: 10,
      bundleDiscount: 0,
      appliedBundles: [],
      campaignId: "camp-1",
      campaignSlug: "sale",
      campaignTitle: "Sale",
      campaignDiscountAmount: 50_000,
    });

    await createOrderFromCart({
      userId: "user-1",
      items: [cartItem],
      promoCode: null,
      status: "pending_payment",
      shipping,
    });

    expect(recordCampaignUsageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "camp-1",
        userId: "user-1",
        discountAmount: 50_000,
        tx: expect.anything(),
      })
    );
  });

  it("rejects empty payable cart", async () => {
    vi.mocked(repriceOrderItems).mockResolvedValueOnce({
      items: [],
      subtotalList: 0,
      subtotalSale: 0,
      totalFurooh: 0,
      payable: 0,
      promoCode: null,
      loyaltyTier: "bronze",
      loyaltyDiscountAmount: 0,
      loyaltyPointsEarned: 0,
      bundleDiscount: 0,
      appliedBundles: [],
      campaignId: null,
      campaignSlug: null,
      campaignTitle: null,
      campaignDiscountAmount: 0,
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
