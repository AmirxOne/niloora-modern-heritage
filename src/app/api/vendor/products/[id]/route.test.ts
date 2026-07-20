import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  updateVendorProduct: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/marketplace/vendor-product-service", () => ({
  updateVendorProduct: mocks.updateVendorProduct,
}));

import { PATCH } from "@/app/api/vendor/products/[id]/route";

describe("PATCH /api/vendor/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/vendor/products/p-b", {
        method: "PATCH",
        body: JSON.stringify({ name: "x" }),
      }),
      { params: Promise.resolve({ id: "p-b" }) }
    );

    expect(response.status).toBe(401);
    expect(mocks.updateVendorProduct).not.toHaveBeenCalled();
  });

  it("returns 403 when vendor A patches vendor B product", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-a", role: "user" });
    mocks.updateVendorProduct.mockRejectedValue(new Error("VENDOR_PRODUCT_FORBIDDEN"));

    const response = await PATCH(
      new Request("http://localhost/api/vendor/products/p-b", {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacked" }),
      }),
      { params: Promise.resolve({ id: "p-b" }) }
    );

    expect(response.status).toBe(403);
    expect(mocks.updateVendorProduct).toHaveBeenCalledWith("user-a", "p-b", { name: "Hacked" });
  });

  it("returns 400 for empty update payload", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-a", role: "user" });

    const response = await PATCH(
      new Request("http://localhost/api/vendor/products/p-a", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "p-a" }) }
    );

    expect(response.status).toBe(400);
    expect(mocks.updateVendorProduct).not.toHaveBeenCalled();
  });

  it("returns updated product for owned listing", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "user-a", role: "user" });
    mocks.updateVendorProduct.mockResolvedValue({ id: "p-a", name: "Updated" });

    const response = await PATCH(
      new Request("http://localhost/api/vendor/products/p-a", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      }),
      { params: Promise.resolve({ id: "p-a" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.product.id).toBe("p-a");
  });
});
