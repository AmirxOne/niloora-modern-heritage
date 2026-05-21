import { describe, expect, it } from "vitest";
import { accountSectionHref, parseAccountSection } from "./sections";

describe("account sections", () => {
  it("parses hash sections", () => {
    expect(parseAccountSection("#orders", null)).toBe("orders");
    expect(parseAccountSection("", null)).toBe(null);
  });

  it("parses legacy query and dashboard alias", () => {
    expect(parseAccountSection("", "profile")).toBe("profile");
    expect(parseAccountSection("#dashboard", null)).toBe("overview");
  });

  it("builds hrefs", () => {
    expect(accountSectionHref("overview")).toBe("/account");
    expect(accountSectionHref("wishlist")).toBe("/account#wishlist");
  });
});
