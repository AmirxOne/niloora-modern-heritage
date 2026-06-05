import { GET } from "@/app/api/products/search/route";
import { haloProduct, sampleProduct } from "../../fixtures/products";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/products", () => ({
  getCatalogProducts: jest.fn(),
}));

import { getCatalogProducts } from "@/lib/server/products";

describe("Integration — GET /api/products/search", () => {
  beforeEach(() => {
    jest.mocked(getCatalogProducts).mockResolvedValue([sampleProduct, haloProduct]);
  });

  it("requires q parameter", async () => {
    const response = await GET(new Request("http://localhost/api/products/search"));
    expect(response.status).toBe(400);
  });

  it("returns fuzzy catalog matches", async () => {
    const response = await GET(
      new Request("http://localhost/api/products/search?q=هاله")
    );
    const { status, json } = await parseJsonResponse<{
      query: string;
      products: { catalog: { id: string }[] };
    }>(response);

    expect(status).toBe(200);
    expect(json.query).toBe("هاله");
    expect(json.products.catalog.some((p) => p.id === haloProduct.id)).toBe(true);
  });
});
