import { test, expect } from "@playwright/test";

test.describe("Guest Flow Smoke", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("protected paths redirect deterministically to auth", async ({ request }) => {
    const account = await request.get("/account", { maxRedirects: 0 });
    expect(account.status()).toBe(307);
    expect(account.headers()["location"] ?? "").toContain("/auth?redirect=%2Faccount");

    const vendor = await request.get("/vendor/dashboard", { maxRedirects: 0 });
    expect(vendor.status()).toBe(307);
    expect(vendor.headers()["location"] ?? "").toContain("/auth?redirect=%2Fvendor%2Fdashboard");
  });

  test("cart validate API handles malformed payload and guest cart checks", async ({ request }) => {
    const malformed = await request.post("/api/cart/validate", {
      data: { items: "bad-shape" },
    });
    expect(malformed.status()).toBe(400);

    const empty = await request.post("/api/cart/validate", {
      data: { items: [] },
    });
    expect(empty.status()).toBe(400);
  });

  test("search API rejects invalid query and serves valid search", async ({ request }) => {
    const longQ = "a".repeat(121);
    const invalid = await request.get(`/api/products/search?q=${encodeURIComponent(longQ)}`);
    expect(invalid.status()).toBe(400);

    const valid = await request.get("/api/products/search?q=%D8%A7%D9%86%DA%AF%D8%B4%D8%AA%D8%B1");
    expect(valid.status()).toBe(200);
    const body = (await valid.json()) as { products?: { catalog?: unknown[] } };
    expect(Array.isArray(body.products?.catalog)).toBe(true);
  });
});
