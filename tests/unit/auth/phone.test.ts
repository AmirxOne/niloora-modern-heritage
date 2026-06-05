import { isValidIranMobile, normalizeIranPhone } from "@/lib/auth/phone";

describe("Authentication — phone normalization", () => {
  it("normalizes +98 format to 09…", () => {
    expect(normalizeIranPhone("+98 912 345 6789")).toBe("09123456789");
  });

  it("accepts Persian digits", () => {
    expect(normalizeIranPhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
  });

  it("rejects invalid mobile prefixes", () => {
    expect(normalizeIranPhone("08123456789")).toBeNull();
    expect(normalizeIranPhone("123")).toBeNull();
  });

  it("validates through isValidIranMobile", () => {
    expect(isValidIranMobile("09121234567")).toBe(true);
    expect(isValidIranMobile("invalid")).toBe(false);
  });
});
