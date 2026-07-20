import { test, expect } from "@playwright/test";
import { gotoStable } from "./support/navigation";

test.describe("Admin Dashboard", () => {
  test("admin root redirects unauthenticated users", async ({ page }) => {
    await gotoStable(page, "/admin");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin orders page requires authentication", async ({ page }) => {
    await gotoStable(page, "/admin/orders");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin products page requires authentication", async ({ page }) => {
    await gotoStable(page, "/admin/products");
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
