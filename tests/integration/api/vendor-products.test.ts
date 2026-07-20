import { POST as createProduct } from "@/app/api/vendor/products/route";
import { PATCH as updateProduct } from "@/app/api/vendor/products/[id]/route";
import { POST as submitProduct } from "@/app/api/vendor/products/[id]/submit/route";
import { parseJsonResponse } from "../../helpers/parse-response";
import { regularUser } from "../../fixtures/users";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/marketplace/vendor-product-service", () => ({
  createVendorProduct: jest.fn(),
  updateVendorProduct: jest.fn(),
  submitVendorProduct: jest.fn(),
  listVendorProducts: jest.fn(),
}));
jest.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendorOwner: jest.fn(),
}));

import { readSessionUser } from "@/lib/server/auth/session";
import {
  createVendorProduct,
  submitVendorProduct,
  updateVendorProduct,
} from "@/lib/server/marketplace/vendor-product-service";
import { requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";

describe("Integration — /api/vendor/products validations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    jest.mocked(requireActiveVendorOwner).mockResolvedValue({
      vendorId: "vendor-1",
      role: "owner",
      vendor: { status: "active" },
    } as never);
  });

  it("rejects invalid create payload", async () => {
    const response = await createProduct(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x" }),
      })
    );

    expect(response.status).toBe(400);
    expect(createVendorProduct).not.toHaveBeenCalled();
  });

  it("accepts valid create payload and normalizes numbers", async () => {
    jest.mocked(createVendorProduct).mockResolvedValue({ id: "prod-1" } as never);

    const response = await createProduct(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vendor Ring",
          namePersian: "انگشتر فروشنده",
          image: "/uploads/vendor-media/vendor-1/ring.webp",
          price: "1200000",
          stock: "5",
          category: "signet",
          metal: "sterling",
          stone: "turquoise",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(createVendorProduct).toHaveBeenCalledWith(
      regularUser.id,
      expect.objectContaining({ price: 1200000, stock: 5 })
    );
  });

  it("rejects empty patch payload", async () => {
    const response = await updateProduct(
      new Request("http://localhost/api/vendor/products/prod-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "prod-1" }) }
    );

    expect(response.status).toBe(400);
    expect(updateVendorProduct).not.toHaveBeenCalled();
  });

  it("returns idempotent submit response", async () => {
    jest.mocked(submitVendorProduct).mockResolvedValue({
      product: { id: "prod-1", publicationStatus: "pending_review" },
      deduped: true,
    } as never);

    const response = await submitProduct(
      new Request("http://localhost/api/vendor/products/prod-1/submit", { method: "POST" }),
      { params: Promise.resolve({ id: "prod-1" }) }
    );
    const { status, json } = await parseJsonResponse<{ deduped: boolean }>(response);

    expect(status).toBe(200);
    expect(json.deduped).toBe(true);
  });

  it("blocks staff from create/submit actions", async () => {
    jest.mocked(requireActiveVendorOwner).mockRejectedValue(new Error("VENDOR_ROLE_FORBIDDEN"));

    const createResponse = await createProduct(
      new Request("http://localhost/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vendor Ring",
          namePersian: "انگشتر فروشنده",
          image: "/uploads/vendor-media/vendor-1/ring.webp",
          price: "1200000",
          stock: "5",
          category: "signet",
          metal: "sterling",
          stone: "turquoise",
        }),
      })
    );
    expect(createResponse.status).toBe(403);

    const submitResponse = await submitProduct(
      new Request("http://localhost/api/vendor/products/prod-1/submit", { method: "POST" }),
      { params: Promise.resolve({ id: "prod-1" }) }
    );
    expect(submitResponse.status).toBe(403);
  });
});
