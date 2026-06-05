import { POST } from "@/app/api/promo/validate/route";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/promo/promo-code-service", () => ({
  validatePromoForCheckout: jest.fn(),
}));

import { validatePromoForCheckout } from "@/lib/server/promo/promo-code-service";

describe("Integration — POST /api/promo/validate (Checkout coupons)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects missing code", async () => {
    const response = await POST(
      new Request("http://localhost/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotalSale: 1_000_000 }),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns validation result for valid promo", async () => {
    jest.mocked(validatePromoForCheckout).mockResolvedValue({
      ok: true,
      promo: {
        id: "promo-1",
        code: "GOLD10",
        label: "۱۰٪ تخفیف",
        type: "percent",
        value: 10,
        minSubtotal: 0,
        replacesSiteWide: false,
      },
    });

    const response = await POST(
      new Request("http://localhost/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "gold10", subtotalSale: 1_000_000 }),
      })
    );
    const { status, json } = await parseJsonResponse<{
      valid: boolean;
      promo: { code: string };
    }>(response);

    expect(status).toBe(200);
    expect(json.valid).toBe(true);
    expect(json.promo.code).toBe("GOLD10");
  });
});
