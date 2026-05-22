import { describe, expect, it } from "vitest";
import {
  fallbackDiscountCountdownConfig,
  resolveDiscountEndsAtFromConfig,
} from "@/lib/discounts/countdown-shared";

describe("resolveDiscountEndsAtFromConfig", () => {
  it("prefers product-specific end date over site default", () => {
    const config = {
      enabled: true,
      defaultEndsAt: "2026-06-10T20:29:59.000Z",
    };
    const resolved = resolveDiscountEndsAtFromConfig(config, "2026-07-01T12:00:00.000Z");
    expect(resolved?.toISOString()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("falls back to site default when product has no end date", () => {
    const config = {
      enabled: true,
      defaultEndsAt: "2026-06-10T20:29:59.000Z",
    };
    const resolved = resolveDiscountEndsAtFromConfig(config, null);
    expect(resolved?.toISOString()).toBe("2026-06-10T20:29:59.000Z");
  });

  it("returns null when countdown is disabled", () => {
    const config = {
      enabled: false,
      defaultEndsAt: "2026-06-10T20:29:59.000Z",
    };
    expect(resolveDiscountEndsAtFromConfig(config, "2026-07-01T12:00:00.000Z")).toBeNull();
  });
});

describe("fallbackDiscountCountdownConfig", () => {
  it("returns enabled config with parsed default date", () => {
    const config = fallbackDiscountCountdownConfig();
    expect(config.enabled).toBe(true);
    expect(config.defaultEndsAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
