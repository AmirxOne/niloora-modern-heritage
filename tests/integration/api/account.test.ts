import { GET, PATCH } from "@/app/api/account/route";
import { regularUser } from "../../fixtures/users";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/preferences", () => ({
  readUserPreferences: jest.fn(),
}));

jest.mock("@/lib/server/loyalty/loyalty", () => ({
  getUserLoyaltySummary: jest.fn(),
}));

jest.mock("@/lib/server/prisma", () => ({
  prisma: {
    order: {
      aggregate: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

import { readSessionUser } from "@/lib/server/auth/session";
import { readUserPreferences } from "@/lib/server/preferences";
import { getUserLoyaltySummary } from "@/lib/server/loyalty/loyalty";
import { prisma } from "@/lib/server/prisma";

describe("Integration — GET /api/account (Profile)", () => {
  beforeEach(() => {
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    jest.mocked(readUserPreferences).mockResolvedValue({
      cartItems: [],
      wishlistIds: ["ring-1", "ring-2"],
      wishlistPriceWatch: {},
      savedDesigns: [],
      compareProductIds: [],
      recentlyViewedIds: [],
      promoCode: null,
    });
    jest.mocked(prisma.order.aggregate).mockResolvedValue({
      _count: { id: 3 },
      _sum: { total: 4_500_000 },
    } as never);
    jest.mocked(getUserLoyaltySummary).mockResolvedValue({
      points: 120,
      lifetimeSpend: 4_500_000,
      tier: "bronze",
      tierDiscountPercent: 0,
      perks: [],
    });
  });

  it("returns 401 without session", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns profile stats for authenticated user", async () => {
    const response = await GET();
    const { status, json } = await parseJsonResponse<{
      user: { phone: string };
      stats: { orderCount: number; wishlistCount: number };
      loyalty: { points: number };
    }>(response);

    expect(status).toBe(200);
    expect(json.user.phone).toBe(regularUser.phone);
    expect(json.stats.orderCount).toBe(3);
    expect(json.stats.wishlistCount).toBe(2);
    expect(json.loyalty.points).toBe(120);
  });

  it("rejects invalid national code in profile update", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalCode: "123" }),
      })
    );
    const { status, json } = await parseJsonResponse<{ message: string }>(response);

    expect(status).toBe(400);
    expect(json.message).toContain("کد ملی");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("updates account profile for authenticated user", async () => {
    jest.mocked(prisma.user.update).mockResolvedValue({
      ...regularUser,
      firstName: "علی",
      lastName: "کریمی",
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "علی", lastName: "کریمی", nationalCode: "0012345678" }),
      })
    );
    const { status, json } = await parseJsonResponse<{ user: { firstName: string } }>(response);

    expect(status).toBe(200);
    expect(json.user.firstName).toBe("علی");
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
