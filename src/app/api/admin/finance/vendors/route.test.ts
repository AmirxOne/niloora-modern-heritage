import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  ensureAdmin: vi.fn(),
  getAdminVendorFinance: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/auth/guards", () => ({
  ensureAdmin: mocks.ensureAdmin,
}));

vi.mock("@/lib/server/marketplace/payout/admin-vendor-finance-service", () => ({
  getAdminVendorFinance: mocks.getAdminVendorFinance,
}));

import { GET } from "@/app/api/admin/finance/vendors/route";

describe("GET /api/admin/finance/vendors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminVendorFinance.mockResolvedValue({
      platform: { grossAmount: 0, commissionAmount: 0, netPending: 0, orderCount: 0 },
      vendors: [],
      topByGross: [],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);
    mocks.ensureAdmin.mockReturnValue(new Response(null, { status: 401 }));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getAdminVendorFinance).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin users", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.ensureAdmin.mockReturnValue(new Response(null, { status: 403 }));

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mocks.getAdminVendorFinance).not.toHaveBeenCalled();
  });

  it("returns marketplace finance for admin", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.ensureAdmin.mockReturnValue(null);
    mocks.getAdminVendorFinance.mockResolvedValue({
      platform: { grossAmount: 100_000, commissionAmount: 10_000, netPending: 90_000, orderCount: 2 },
      vendors: [],
      topByGross: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.finance.platform.grossAmount).toBe(100_000);
  });
});
