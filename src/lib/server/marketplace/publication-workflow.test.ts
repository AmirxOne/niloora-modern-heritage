import { describe, expect, it } from "vitest";
import {
  adminApproveTargetStatus,
  assertVendorSubmitTransition,
  canVendorEditProduct,
  canVendorSubmitProduct,
} from "@/lib/server/marketplace/publication-workflow";

describe("publication-workflow", () => {
  it("allows vendor edit only in draft or rejected", () => {
    expect(canVendorEditProduct("draft")).toBe(true);
    expect(canVendorEditProduct("rejected")).toBe(true);
    expect(canVendorEditProduct("pending_review")).toBe(false);
    expect(canVendorEditProduct("published")).toBe(false);
  });

  it("vendor submit moves draft/rejected to pending_review", () => {
    expect(canVendorSubmitProduct("draft")).toBe(true);
    expect(assertVendorSubmitTransition("draft")).toBe("pending_review");
    expect(assertVendorSubmitTransition("rejected")).toBe("pending_review");
  });

  it("rejects invalid vendor submit transitions", () => {
    expect(() => assertVendorSubmitTransition("published")).toThrow("PRODUCT_SUBMIT_INVALID_STATE");
  });

  it("admin approve publishes product", () => {
    expect(adminApproveTargetStatus()).toBe("published");
  });
});
