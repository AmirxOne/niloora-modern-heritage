import { describe, expect, it } from "vitest";
import { isVendorPortalPath } from "@/lib/vendor/portal-paths";

describe("isVendorPortalPath", () => {
  it("detects seller portal routes", () => {
    expect(isVendorPortalPath("/vendor/dashboard")).toBe(true);
    expect(isVendorPortalPath("/vendor/apply")).toBe(true);
    expect(isVendorPortalPath("/vendor/products")).toBe(true);
    expect(isVendorPortalPath("/vendor/payouts")).toBe(true);
  });

  it("treats slug storefront as public", () => {
    expect(isVendorPortalPath("/vendor/atelier-ali")).toBe(false);
  });
});
