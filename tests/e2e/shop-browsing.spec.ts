import { test, expect } from "@playwright/test";
import { gotoStable } from "./support/navigation";

test.describe("Product Browsing", () => {
  test("shop gallery page loads", async ({ page }) => {
    await gotoStable(page, "/shop");
    await expect(page).toHaveURL(/\/shop/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("home page loads storefront", async ({ page }) => {
    await gotoStable(page, "/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("health API responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBeDefined();
  });
});
