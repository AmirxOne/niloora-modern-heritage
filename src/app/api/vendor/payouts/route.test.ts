import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  requireActiveVendor: vi.fn(),
  listVendorPayouts: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendor: mocks.requireActiveVendor,
}));

vi.mock("@/lib/server/marketplace/payout/vendor-payout-service", () => ({
  listVendorPayouts: mocks.listVendorPayouts,
}));

import { GET } from "@/app/api/vendor/payouts/route";

describe("GET /api/vendor/payouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listVendorPayouts.mockResolvedValue({
      pendingTotal: 0,
      earnedTotal: 0,
      paidTotal: 0,
      entries: [],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/vendor/payouts"));

    expect(response.status).toBe(401);
    expect(mocks.requireActiveVendor).not.toHaveBeenCalled();
  });

  it("returns 403 when vendor is not active", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.requireActiveVendor.mockRejectedValue(new Error("VENDOR_NOT_ACTIVE"));

    const response = await GET(new Request("http://localhost/api/vendor/payouts"));

    expect(response.status).toBe(403);
    expect(mocks.listVendorPayouts).not.toHaveBeenCalled();
  });

  it("returns payouts for active vendor", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.requireActiveVendor.mockResolvedValue({ vendorId: "vendor-1", vendor: { status: "active" } });
    mocks.listVendorPayouts.mockResolvedValue({
      pendingTotal: 50_000,
      earnedTotal: 50_000,
      paidTotal: 0,
      entries: [{ id: "ledger-1", orderId: "order-1" }],
    });

    const response = await GET(new Request("http://localhost/api/vendor/payouts?page=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.listVendorPayouts).toHaveBeenCalledWith("vendor-1", { page: 1, pageSize: 20 });
    expect(body.payouts).toMatchObject({
      pendingTotal: 50_000,
      earnedTotal: expect.any(Number),
      paidTotal: expect.any(Number),
      entries: expect.any(Array),
    });
  });
});
