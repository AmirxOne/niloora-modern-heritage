import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows internal paths", () => {
    expect(safeRedirectPath("/account")).toBe("/account");
    expect(safeRedirectPath("/shop?stone=diamond")).toBe("/shop?stone=diamond");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/account");
    expect(safeRedirectPath("https://evil.com")).toBe("/account");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/account");
  });
});
