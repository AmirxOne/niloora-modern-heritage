import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  ensureAdmin: vi.fn(),
  getAdminDemandAnalytics: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/auth/guards", () => ({
  ensureAdmin: mocks.ensureAdmin,
}));

vi.mock("@/lib/server/admin/demand-analytics", () => ({
  getAdminDemandAnalytics: mocks.getAdminDemandAnalytics,
}));

import { GET } from "@/app/api/admin/analytics/demand/route";

describe("GET /api/admin/analytics/demand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminDemandAnalytics.mockResolvedValue({
      topProducts: [],
      topSearches: [{ query: "فیروزه", count: 0, isPlaceholder: true }],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);
    mocks.ensureAdmin.mockReturnValue(new Response(null, { status: 401 }));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getAdminDemandAnalytics).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin users", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.ensureAdmin.mockReturnValue(new Response(null, { status: 403 }));

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mocks.getAdminDemandAnalytics).not.toHaveBeenCalled();
  });

  it("returns demand analytics for admin", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.getAdminDemandAnalytics.mockResolvedValue({
      topProducts: [
        {
          productId: "p1",
          name: "انگشتر فیروزه",
          wishlistCount: 3,
          pendingBackInStockCount: 2,
          demandScore: 5,
        },
      ],
      topSearches: [{ query: "فیروزه", count: 0, isPlaceholder: true }],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.demand.topProducts).toHaveLength(1);
    expect(body.demand.topProducts[0].demandScore).toBe(5);
    expect(body.demand.topSearches[0].isPlaceholder).toBe(true);
  });
});
