import { describe, expect, it } from "vitest";
import {
  getAuthDeniedMessage,
  isAuthDenied,
  parseApiErrorMessage,
} from "./fetch-utils";

describe("fetch-utils", () => {
  it("detects auth denied statuses", () => {
    expect(isAuthDenied(new Response(null, { status: 401 }))).toBe(true);
    expect(isAuthDenied(new Response(null, { status: 403 }))).toBe(true);
    expect(isAuthDenied(new Response(null, { status: 404 }))).toBe(false);
  });

  it("returns contextual auth messages", () => {
    expect(getAuthDeniedMessage(401, "admin")).toContain("مدیریت");
    expect(getAuthDeniedMessage(403, "user")).toContain("دسترسی");
  });

  it("parses API error bodies", async () => {
    const response = new Response(JSON.stringify({ message: "خطای تست" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseApiErrorMessage(response, "پیش‌فرض")).resolves.toBe("خطای تست");
  });
});
