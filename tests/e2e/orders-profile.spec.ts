import { test, expect } from "@playwright/test";
import { gotoStable } from "./support/navigation";

test.describe("Orders & Profile", () => {
  test("account page requires login", async ({ page }) => {
    await gotoStable(page, "/account");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("account API requires session", async ({ request }) => {
    const response = await request.get("/api/account");
    expect(response.status()).toBe(401);
  });

  test("returns page is public", async ({ page }) => {
    await gotoStable(page, "/returns");
    await expect(page.locator("body")).toBeVisible();
  });
});
