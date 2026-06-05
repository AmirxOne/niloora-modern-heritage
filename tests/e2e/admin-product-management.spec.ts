import { test, expect } from "@playwright/test";

test.describe("Admin — Product Management", () => {
  test("admin products UI is protected", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin product create API rejects unauthenticated POST", async ({ request }) => {
    const response = await request.post("/api/admin/products", {
      data: { id: "e2e-test", name: "Test" },
    });
    expect(response.status()).toBe(401);
  });
});
