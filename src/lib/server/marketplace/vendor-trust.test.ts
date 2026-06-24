import { describe, expect, it } from "vitest";
import { computeVendorTrustScore } from "@/lib/server/marketplace/vendor-trust";

const now = new Date("2026-06-24T12:00:00Z");

describe("computeVendorTrustScore", () => {
  it("returns higher score for active vendors with good ratings", () => {
    const strong = computeVendorTrustScore(
      {
        status: "active",
        approvedAt: new Date("2025-06-01T00:00:00Z"),
        createdAt: new Date("2025-01-01T00:00:00Z"),
        avgCommentRating: 4.8,
        returnRate: 0.02,
      },
      now
    );

    const weak = computeVendorTrustScore(
      {
        status: "draft",
        approvedAt: null,
        createdAt: new Date("2026-06-01T00:00:00Z"),
        avgCommentRating: 2,
        returnRate: 0.4,
      },
      now
    );

    expect(strong).toBeGreaterThan(70);
    expect(weak).toBeLessThan(strong);
  });

  it("clamps score between 0 and 100", () => {
    const score = computeVendorTrustScore(
      {
        status: "active",
        approvedAt: new Date("2020-01-01T00:00:00Z"),
        createdAt: new Date("2020-01-01T00:00:00Z"),
        avgCommentRating: 5,
        returnRate: 0,
      },
      now
    );

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
