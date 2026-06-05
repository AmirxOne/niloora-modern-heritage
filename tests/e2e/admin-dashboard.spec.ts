import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("admin root redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin orders page requires authentication", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin products page requires authentication", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin orders API returns 401 without session", async ({ request }) => {
    const response = await request.get("/api/admin/orders");
    expect(response.status()).toBe(401);
  });

  test("admin products API returns 401 without session", async ({ request }) => {
    const response = await request.get("/api/admin/products");
    expect(response.status()).toBe(401);
  });
});
