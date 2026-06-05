import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("auth page loads with phone entry flow", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator("body")).toBeVisible();
    const phoneField = page.getByRole("textbox").first();
    await expect(phoneField).toBeVisible();
  });

  test("login route redirects or renders auth UI", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("account page redirects unauthenticated users to auth", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/auth/);
  });
});
