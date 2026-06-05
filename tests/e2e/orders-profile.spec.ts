import { test, expect } from "@playwright/test";

test.describe("Orders & Profile", () => {
  test("account page requires login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("account API requires session", async ({ request }) => {
    const response = await request.get("/api/account");
    expect(response.status()).toBe(401);
  });

  test("returns page is public", async ({ page }) => {
    await page.goto("/returns");
    await expect(page.locator("body")).toBeVisible();
  });
});
