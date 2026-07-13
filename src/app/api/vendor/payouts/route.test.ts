import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockPayoutError extends Error {
    code = "payout_nothing_to_pay";
  }
  return {
    readSessionUser: vi.fn(),
    requireActiveVendor: vi.fn(),
    listVendorPayouts: vi.fn(),
    requestPayout: vi.fn(),
    MockPayoutError,
  };
});

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendor: mocks.requireActiveVendor,
}));

vi.mock("@/lib/server/marketplace/payout/vendor-payout-service", () => ({
  listVendorPayouts: mocks.listVendorPayouts,
}));

vi.mock("@/lib/server/marketplace/payout/payout-service", () => ({
  requestPayout: mocks.requestPayout,
  PayoutError: mocks.MockPayoutError,
}));

vi.mock("@/lib/server/marketplace/payout/payout-dto", () => ({
  toPayoutDto: (p: unknown) => p,
}));

import { GET, POST } from "@/app/api/vendor/payouts/route";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/vendor/payouts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

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
  });

  it("returns payouts for active vendor", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.requireActiveVendor.mockResolvedValue({ vendorId: "vendor-1", vendor: { status: "active" } });
    const response = await GET(new Request("http://localhost/api/vendor/payouts?page=1"));
    expect(response.status).toBe(200);
  });
});

describe("POST /api/vendor/payouts (request payout)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSessionUser.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.requireActiveVendor.mockResolvedValue({
      vendorId: "vendor-1",
      userId: "user-1",
      role: "owner",
      vendor: { status: "active" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);
    const response = await POST(postRequest({ reference: "r1" }));
    expect(response.status).toBe(401);
  });

  it("returns 403 for non-owner members", async () => {
    mocks.requireActiveVendor.mockResolvedValue({
      vendorId: "vendor-1",
      userId: "user-1",
      role: "staff",
      vendor: { status: "active" },
    });
    const response = await POST(postRequest({ reference: "r1" }));
    expect(response.status).toBe(403);
    expect(mocks.requestPayout).not.toHaveBeenCalled();
  });

  it("requires a reference (idempotency key)", async () => {
    const response = await POST(postRequest({}));
    expect(response.status).toBe(400);
  });

  it("creates a payout for an owner (sweep mode)", async () => {
    mocks.requestPayout.mockResolvedValue({
      payout: { id: "pay-1", status: "pending", amount: 150 },
      deduped: false,
      settlementIds: ["s1"],
    });
    const response = await POST(postRequest({ reference: "r1" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.requestPayout).toHaveBeenCalledWith(
      expect.objectContaining({ vendorId: "vendor-1", userId: "user-1", reference: "r1" })
    );
    expect(body.payout).toMatchObject({ id: "pay-1" });
  });

  it("maps nothing-to-pay to 400", async () => {
    mocks.requestPayout.mockRejectedValue(new mocks.MockPayoutError("empty"));
    const response = await POST(postRequest({ reference: "r1" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("payout_nothing_to_pay");
  });
});
