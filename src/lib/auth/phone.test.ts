import { describe, expect, it } from "vitest";
import { isValidIranMobile, normalizeIranPhone } from "@/lib/auth/phone";

describe("normalizeIranPhone", () => {
  it("normalizes +98 format", () => {
    expect(normalizeIranPhone("+98 912 345 6789")).toBe("09123456789");
  });

  it("normalizes 10-digit 9xx", () => {
    expect(normalizeIranPhone("9123456789")).toBe("09123456789");
  });

  it("accepts Persian digits", () => {
    expect(normalizeIranPhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeIranPhone("08123456789")).toBeNull();
    expect(normalizeIranPhone("123")).toBeNull();
  });
});

describe("isValidIranMobile", () => {
  it("mirrors normalizeIranPhone", () => {
    expect(isValidIranMobile("09121234567")).toBe(true);
    expect(isValidIranMobile("invalid")).toBe(false);
  });
});
