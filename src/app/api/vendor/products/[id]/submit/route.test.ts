import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  requireActiveVendorOwner: vi.fn(),
  submitVendorProduct: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/marketplace/vendor-product-service", () => ({
  submitVendorProduct: mocks.submitVendorProduct,
}));
vi.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendorOwner: mocks.requireActiveVendorOwner,
}));

import { POST } from "@/app/api/vendor/products/[id]/submit/route";

describe("POST /api/vendor/products/[id]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireActiveVendorOwner.mockResolvedValue({
      vendorId: "vendor-1",
      role: "owner",
      vendor: { status: "active" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/vendor/products/p-1/submit"), {
      params: Promise.resolve({ id: "p-1" }),
    });

    expect(response.status).toBe(401);
    expect(mocks.submitVendorProduct).not.toHaveBeenCalled();
  });

  it("returns deduped submit response", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "vendor-user", role: "user" });
    mocks.submitVendorProduct.mockResolvedValue({
      product: { id: "p-1", publicationStatus: "pending_review" },
      deduped: true,
    });

    const response = await POST(new Request("http://localhost/api/vendor/products/p-1/submit"), {
      params: Promise.resolve({ id: "p-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.deduped).toBe(true);
    expect(payload.product.id).toBe("p-1");
  });

  it("returns 403 for staff submit attempts", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "vendor-staff", role: "user" });
    mocks.requireActiveVendorOwner.mockRejectedValue(new Error("VENDOR_ROLE_FORBIDDEN"));
    const response = await POST(
      new Request("http://localhost/api/vendor/products/p-1/submit"),
      { params: Promise.resolve({ id: "p-1" }) }
    );
    expect(response.status).toBe(403);
    expect(mocks.submitVendorProduct).not.toHaveBeenCalled();
  });
});
