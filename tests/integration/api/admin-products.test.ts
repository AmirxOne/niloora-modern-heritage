import { GET, POST } from "@/app/api/admin/products/route";
import { adminUser, regularUser } from "../../fixtures/users";
import { sampleProduct } from "../../fixtures/products";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/products/admin-product-service", () => ({
  listAdminProducts: jest.fn(),
  createAdminProduct: jest.fn(),
}));

jest.mock("@/lib/server/audit-log", () => ({
  writeAdminAuditLog: jest.fn(),
}));

import { readSessionUser } from "@/lib/server/auth/session";
import {
  createAdminProduct,
  listAdminProducts,
} from "@/lib/server/products/admin-product-service";

describe("Integration — /api/admin/products (Product Management)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(listAdminProducts).mockResolvedValue([
      {
        id: sampleProduct.id,
        name: sampleProduct.name,
        price: sampleProduct.price,
        availability: sampleProduct.availability,
        stock: sampleProduct.stock,
      },
    ] as never);
  });

  it("GET forbids non-admin users", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("GET lists products for admin", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(adminUser as never);
    const response = await GET();
    const { status, json } = await parseJsonResponse<{
      products: { id: string }[];
    }>(response);

    expect(status).toBe(200);
    expect(json.products[0].id).toBe(sampleProduct.id);
  });

  it("POST rejects invalid product body", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(adminUser as never);
    const response = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "incomplete" }),
      })
    );
    expect(response.status).toBe(400);
    expect(createAdminProduct).not.toHaveBeenCalled();
  });
});
