import { POST } from "@/app/api/cart/validate/route";
import { CartPurchaseError } from "@/lib/server/products/validate-cart-purchase";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/products/validate-cart-purchase", () => ({
  CartPurchaseError: class CartPurchaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CartPurchaseError";
    }
  },
  validateAddToCart: jest.fn(),
  validateCartPurchase: jest.fn(),
}));

import {
  validateAddToCart,
  validateCartPurchase,
} from "@/lib/server/products/validate-cart-purchase";

describe("Integration — POST /api/cart/validate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects empty cart payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
      })
    );
    expect(response.status).toBe(400);
  });

  it("rejects malformed cart payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: "bad-shape" }),
      })
    );
    expect(response.status).toBe(400);
  });

  it("validates full cart items", async () => {
    jest.mocked(validateCartPurchase).mockResolvedValue(undefined);

    const response = await POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: "line-1",
              productId: "ring-1",
              name: "Test",
              price: 1_000_000,
              quantity: 1,
              image: "/img.jpg",
            },
          ],
        }),
      })
    );
    const { status, json } = await parseJsonResponse<{ valid: boolean }>(response);

    expect(status).toBe(200);
    expect(json.valid).toBe(true);
    expect(validateCartPurchase).toHaveBeenCalled();
  });

  it("maps CartPurchaseError to 400", async () => {
    jest
      .mocked(validateCartPurchase)
      .mockRejectedValue(new CartPurchaseError("موجودی کافی نیست."));

    const response = await POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: "line-1",
              productId: "ring-1",
              name: "Test",
              price: 1_000_000,
              quantity: 2,
              image: "/img.jpg",
            },
          ],
        }),
      })
    );
    const { status, json } = await parseJsonResponse<{ message: string }>(response);

    expect(status).toBe(400);
    expect(json.message).toContain("موجودی");
  });

  it("validates single add-to-cart payload", async () => {
    jest.mocked(validateAddToCart).mockResolvedValue(undefined);

    const response = await POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "ring-1",
          quantity: 1,
          existingItems: [],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(validateAddToCart).toHaveBeenCalledWith({
      productId: "ring-1",
      quantity: 1,
      existingItems: [],
    });
  });
});
