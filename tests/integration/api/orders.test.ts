import { GET, POST } from "@/app/api/orders/route";
import { adminUser, regularUser } from "../../fixtures/users";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/prisma", () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
    },
  },
}));

import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

describe("Integration — /api/orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET returns 401 without session", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("GET returns user orders", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    jest.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: "HS-ORDER1",
        userId: regularUser.id,
        status: "processing",
        total: 1_500_000,
        subtotalList: 1_600_000,
        totalFurooh: 100_000,
        promoCode: null,
        shippingCost: 50_000,
        shippingName: "کاربر",
        shippingPhone: regularUser.phone,
        shippingProvince: "تهران",
        shippingCity: "تهران",
        shippingAddress: "خیابان تست",
        shippingPostalCode: "1234567890",
        orderNote: null,
        shippingMethod: "standard",
        paymentMethod: "zarinpal",
        installmentMonths: null,
        installmentAmount: null,
        bundleDiscount: null,
        appliedBundles: null,
        giftCardCode: null,
        giftCardAppliedAmount: null,
        loyaltyTier: "bronze",
        loyaltyDiscountAmount: null,
        loyaltyPointsEarned: null,
        campaignId: null,
        campaignDiscountAmount: null,
        orderType: "product",
        trackingCode: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        items: [
          {
            id: "item-1",
            orderId: "HS-ORDER1",
            productId: "ring-1",
            name: "انگشتر",
            price: 1_450_000,
            listPrice: 1_500_000,
            quantity: 1,
            image: "/img.jpg",
            availability: "ready",
            customizerState: null,
            ringPurchaseCustomization: null,
          },
        ],
      },
    ] as never);

    const response = await GET();
    const { status, json } = await parseJsonResponse<{ orders: { id: string }[] }>(response);

    expect(status).toBe(200);
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0].id).toBe("HS-ORDER1");
  });

  it("POST rejects direct order creation", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(adminUser as never);
    const response = await POST();
    const { status, json } = await parseJsonResponse<{ message: string }>(response);

    expect(status).toBe(400);
    expect(json.message).toContain("/api/payments/zarinpal/request");
  });
});
