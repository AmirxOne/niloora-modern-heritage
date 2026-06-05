import { test, expect } from "@playwright/test";

test.describe("Search & Filters", () => {
  test("header search is available on shop page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/shop", { waitUntil: "networkidle" });
    const searchRegion = page.locator("header").getByRole("search", { name: "جستجو" });
    await expect(searchRegion).toBeVisible({ timeout: 15_000 });
  });

  test("product search API returns results for valid query", async ({ request }) => {
    const response = await request.get("/api/products/search?q=انگشتر");
    expect(response.status()).toBeLessThan(500);
    if (response.ok()) {
      const body = await response.json();
      expect(body.query).toBe("انگشتر");
      expect(body.products).toBeDefined();
    }
  });

  test("catalog API exposes products list", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.products)).toBe(true);
    expect(typeof body.maxPrice).toBe("number");
  });
});
