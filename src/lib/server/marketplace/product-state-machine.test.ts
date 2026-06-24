import { describe, expect, it } from "vitest";
import {
  assertPublicationTransition,
  canTransition,
} from "@/lib/server/marketplace/product-state-machine";

describe("product-state-machine", () => {
  it("allows vendor submit transitions", () => {
    expect(canTransition("draft", "pending_review", "vendor")).toBe(true);
    expect(canTransition("rejected", "pending_review", "vendor")).toBe(true);
    expect(canTransition("published", "pending_review", "vendor")).toBe(false);
  });

  it("allows admin moderation transitions", () => {
    expect(canTransition("pending_review", "published", "admin")).toBe(true);
    expect(canTransition("pending_review", "rejected", "admin")).toBe(true);
    expect(canTransition("draft", "published", "admin")).toBe(false);
  });

  it("allows vendor initial draft creation", () => {
    expect(canTransition(null, "draft", "vendor")).toBe(true);
    expect(canTransition(null, "draft", "admin")).toBe(false);
  });

  it("rejects invalid transitions with error", () => {
    expect(() =>
      assertPublicationTransition("published", "draft", "vendor", "PRODUCT_SUBMIT_INVALID_STATE")
    ).toThrow("PRODUCT_SUBMIT_INVALID_STATE");
  });
});
