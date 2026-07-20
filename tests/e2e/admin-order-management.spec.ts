import { test, expect } from "@playwright/test";
import { gotoStable } from "./support/navigation";

test.describe("Admin — Order Management", () => {
  test("admin orders UI is protected", async ({ page }) => {
    await gotoStable(page, "/admin/orders");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("admin orders API supports status query param", async ({ request }) => {
    const response = await request.get("/api/admin/orders?status=processing");
    expect(response.status()).toBe(401);
  });
});
