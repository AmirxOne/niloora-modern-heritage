import { GET } from "@/app/api/products/route";
import { sampleProduct } from "../../fixtures/products";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/products", () => ({
  getCatalogProducts: jest.fn(),
  getCatalogMaxPrice: jest.fn(),
}));

import { getCatalogMaxPrice, getCatalogProducts } from "@/lib/server/products";

describe("Integration — GET /api/products", () => {
  beforeEach(() => {
    jest.mocked(getCatalogProducts).mockResolvedValue([sampleProduct]);
    jest.mocked(getCatalogMaxPrice).mockReturnValue(120_000_000);
  });

  it("returns catalog products and max price", async () => {
    const response = await GET(new Request("http://localhost/api/products"));
    expect(response).toBeDefined();
    if (!response) {
      throw new Error("Expected Response from GET /api/products");
    }
    const { status, json } = await parseJsonResponse<{
      products: typeof sampleProduct[];
      maxPrice: number;
    }>(response);

    expect(status).toBe(200);
    expect(json.products).toHaveLength(1);
    expect(json.products[0].id).toBe(sampleProduct.id);
    expect(json.maxPrice).toBe(120_000_000);
  });

  it("rejects invalid limit query", async () => {
    const response = await GET(new Request("http://localhost/api/products?limit=not-a-number"));
    expect(response).toBeDefined();
    if (!response) {
      throw new Error("Expected Response from GET /api/products");
    }
    expect(response.status).toBe(400);
  });

  it("rejects excessive offset query", async () => {
    const response = await GET(new Request("http://localhost/api/products?offset=99999999"));
    expect(response).toBeDefined();
    if (!response) {
      throw new Error("Expected Response from GET /api/products");
    }
    expect(response.status).toBe(400);
  });
});
