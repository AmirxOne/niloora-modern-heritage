import { test, expect } from "@playwright/test";
import { gotoStable } from "./support/navigation";

test.describe("Cart & Checkout", () => {
  test("cart page loads", async ({ page }) => {
    await gotoStable(page, "/cart");
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("cart validate API rejects empty payload", async ({ request }) => {
    const response = await request.post("/api/cart/validate", {
      data: { items: [] },
    });
    expect(response.status()).toBe(400);
  });

  test("direct order POST is disabled", async ({ request }) => {
    const response = await request.post("/api/orders");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("zarinpal");
  });

  test("orders API requires authentication", async ({ request }) => {
    const response = await request.get("/api/orders");
    expect(response.status()).toBe(401);
  });
});
