import { GET } from "@/app/api/admin/orders/route";
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

jest.mock("@/lib/server/returns/order-return-service", () => ({
  loadOrderReturnSummariesByOrderIds: jest.fn(() => Promise.resolve(new Map())),
}));

import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

describe("Integration — GET /api/admin/orders (Order Management)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: "HS-ADMIN-1",
        userId: regularUser.id,
        status: "processing",
        total: 2_000_000,
        subtotalList: 2_100_000,
        totalFurooh: 100_000,
        promoCode: null,
        shippingCost: 50_000,
        shippingName: "مشتری",
        shippingPhone: regularUser.phone,
        shippingProvince: "تهران",
        shippingCity: "تهران",
        shippingAddress: "آدرس",
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
        loyaltyTier: null,
        loyaltyDiscountAmount: null,
        loyaltyPointsEarned: null,
        campaignId: null,
        campaignDiscountAmount: null,
        orderType: "product",
        trackingCode: null,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
        user: { name: regularUser.name, phone: regularUser.phone, email: null },
        items: [],
      },
    ] as never);
  });

  it("returns 401 without session", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/admin/orders"));
    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    const response = await GET(new Request("http://localhost/api/admin/orders"));
    expect(response.status).toBe(403);
  });

  it("lists orders for admin with optional status filter", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(adminUser as never);

    const response = await GET(
      new Request("http://localhost/api/admin/orders?status=processing")
    );
    const { status, json } = await parseJsonResponse<{
      orders: { id: string; status: string }[];
    }>(response);

    expect(status).toBe(200);
    expect(json.orders).toHaveLength(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "processing" },
      })
    );
  });
});
