import { test, expect, request } from "@playwright/test";
import { apiLogin, uiLogin, TEST_SELLER_PHONE, TEST_ADMIN_PHONE, TEST_CUSTOMER_PHONE, TEST_PASSWORD } from "./helpers";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

test.describe("seller & admin marketplace UI routes", () => {
  test("/seller renders registration form for logged-in non-seller", async ({ page }) => {
    await uiLogin(page, TEST_CUSTOMER_PHONE, TEST_PASSWORD);
    await page.goto("/seller");
    await expect(page.getByText("ساخت فروشگاه").first()).toBeVisible({ timeout: 30_000 });
  });

  test("/seller renders shop dashboard for an active seller", async ({ page }) => {
    await uiLogin(page, TEST_SELLER_PHONE, TEST_PASSWORD);
    await page.goto("/seller");
    // shop header with slug + stats cards
    await expect(page.getByText(/shop-a/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("محصولات من").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("تسویه حساب").first()).toBeVisible({ timeout: 15_000 });
  });

  test("/admin/sellers renders for admin and lists seeded shops", async ({ page }) => {
    await uiLogin(page, TEST_ADMIN_PHONE, TEST_PASSWORD);
    await page.goto("/admin/sellers");
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("فروشندگان", {
      timeout: 30_000,
    });
    await expect(page.getByText(/shop-a/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/shop-b/).first()).toBeVisible({ timeout: 30_000 });
  });

  test("/admin/sellers blocked for regular user", async ({ page }) => {
    await uiLogin(page, TEST_CUSTOMER_PHONE, TEST_PASSWORD);
    await page.goto("/admin/sellers");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"), {
      timeout: 15_000,
    });
  });
});
