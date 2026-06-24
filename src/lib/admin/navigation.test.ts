import { describe, expect, it } from "vitest";
import {
  getAdminNavItemsForRole,
  resolveLegacyAdminRedirect,
} from "./navigation";

describe("admin navigation", () => {
  it("resolves legacy hash redirects", () => {
    expect(resolveLegacyAdminRedirect("#admin-orders", null)).toBe("/admin/orders");
    expect(resolveLegacyAdminRedirect("", "admin-products")).toBe("/admin/products");
    expect(resolveLegacyAdminRedirect("#wishlist", null)).toBeNull();
  });

  it("filters nav items by role", () => {
    const adminItems = getAdminNavItemsForRole("admin");
    expect(adminItems.some((item) => item.id === "orders")).toBe(true);
    expect(adminItems.some((item) => item.id === "users")).toBe(true);

    const editorItems = getAdminNavItemsForRole("editor");
    expect(editorItems.some((item) => item.id === "posts")).toBe(true);
    expect(editorItems.some((item) => item.id === "users")).toBe(false);
  });

  it("includes full commerce and ops admin nav items with labels", () => {
    const required = [
      "bundles",
      "campaigns",
      "back-in-stock-alerts",
      "ring-customization",
      "media",
      "ab-tests",
      "audit-logs",
      "gift-cards",
      "customizer-quotes",
      "moderation",
      "vendors",
      "products-pending",
    ] as const;

    const adminItems = getAdminNavItemsForRole("admin");
    const byId = Object.fromEntries(adminItems.map((item) => [item.id, item]));

    for (const id of required) {
      expect(byId[id], `missing nav item: ${id}`).toBeDefined();
      expect(byId[id].label.trim().length).toBeGreaterThan(0);
      expect(byId[id].href).toMatch(/^\/admin\//);
    }
  });
});
