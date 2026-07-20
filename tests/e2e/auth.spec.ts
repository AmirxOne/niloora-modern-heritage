import { test, expect } from "@playwright/test";
import { gotoStable } from "./support/navigation";

test.describe("Authentication", () => {
  test("auth page loads with phone entry flow", async ({ page }) => {
    await gotoStable(page, "/auth");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator("body")).toBeVisible();
    const phoneField = page.getByRole("textbox").first();
    await expect(phoneField).toBeVisible();
  });

  test("login route redirects or renders auth UI", async ({ page }) => {
    await gotoStable(page, "/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("account page redirects unauthenticated users to auth", async ({ page }) => {
    await gotoStable(page, "/account");
    await expect(page).toHaveURL(/\/auth/);
  });
});
