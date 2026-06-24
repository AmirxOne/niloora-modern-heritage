import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  getVendorDashboard: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/vendor/vendor-dashboard-service", () => ({
  getVendorDashboard: mocks.getVendorDashboard,
}));

import { GET } from "@/app/api/vendor/dashboard/route";

const dashboardFixture = {
  vendor: {
    id: "vendor-1",
    slug: "atelier-test",
    displayName: "Atelier Test",
    status: "active",
    settings: {
      maxActiveProducts: 10,
      maxPendingSubmissions: 5,
      quotaMode: "default",
    },
  },
  products: {
    total: 3,
    draft: 1,
    pending_review: 1,
    published: 1,
    rejected: 0,
    archived: 0,
  },
  quota: {
    maxActiveProducts: 10,
    maxPendingSubmissions: 5,
    draftLike: 1,
    pending: 1,
    published: 1,
    atCreateLimit: false,
    atSubmitLimit: false,
  },
  orders: { count30d: 2, recent: [] },
  revenue: { gross30d: 500_000, pendingPayout: 45_000, paidTotal: 0 },
};

describe("GET /api/vendor/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getVendorDashboard.mockResolvedValue(dashboardFixture);
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getVendorDashboard).not.toHaveBeenCalled();
  });

  it("returns dashboard DTO with expected shape", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dashboard).toMatchObject({
      vendor: expect.objectContaining({ id: "vendor-1", status: "active" }),
      products: expect.objectContaining({
        total: expect.any(Number),
        draft: expect.any(Number),
        pending_review: expect.any(Number),
        published: expect.any(Number),
      }),
      quota: expect.objectContaining({
        atCreateLimit: expect.any(Boolean),
        atSubmitLimit: expect.any(Boolean),
      }),
      orders: expect.objectContaining({
        count30d: expect.any(Number),
        recent: expect.any(Array),
      }),
      revenue: expect.objectContaining({
        gross30d: expect.any(Number),
        pendingPayout: expect.any(Number),
        paidTotal: expect.any(Number),
      }),
    });
    expect(mocks.getVendorDashboard).toHaveBeenCalledWith("user-1");
  });
});
