import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  requireActiveVendorOwner: vi.fn(),
  createVendorProduct: vi.fn(),
  listVendorProducts: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/marketplace/vendor-product-service", () => ({
  createVendorProduct: mocks.createVendorProduct,
  listVendorProducts: mocks.listVendorProducts,
}));
vi.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendorOwner: mocks.requireActiveVendorOwner,
}));

import { POST } from "@/app/api/vendor/products/route";

describe("POST /api/vendor/products", () => {
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

    const response = await POST(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.createVendorProduct).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "vendor-user", role: "user" });

    const response = await POST(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: " " }),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.createVendorProduct).not.toHaveBeenCalled();
  });

  it("creates product with normalized fields", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "vendor-user", role: "user" });
    mocks.createVendorProduct.mockResolvedValue({ id: "p-1" });

    const response = await POST(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: " Ring A ",
          namePersian: " انگشتر A ",
          image: "/uploads/vendor-media/v1/x.webp",
          price: "4500000",
          stock: "3",
          category: "signet",
          metal: "sterling",
          stone: "turquoise",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.createVendorProduct).toHaveBeenCalledWith(
      "vendor-user",
      expect.objectContaining({
        name: "Ring A",
        namePersian: "انگشتر A",
        image: "/uploads/vendor-media/v1/x.webp",
        price: 4500000,
        stock: 3,
      })
    );
  });

  it("returns 403 for staff create attempts", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "vendor-staff", role: "user" });
    mocks.requireActiveVendorOwner.mockRejectedValue(new Error("VENDOR_ROLE_FORBIDDEN"));

    const response = await POST(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ring A",
          namePersian: "انگشتر",
          image: "/uploads/vendor-media/v1/x.webp",
          price: "1000",
          stock: "1",
        }),
      })
    );

    expect(response.status).toBe(403);
    expect(mocks.createVendorProduct).not.toHaveBeenCalled();
  });
});
