import { describe, expect, it } from "vitest";
import type { RefundStatus } from "@prisma/client";
import {
  assertRefundTransition,
  canTransitionRefund,
  REFUND_TERMINAL_STATUSES,
  RefundTransitionError,
} from "@/lib/server/marketplace/refund/refund-state-machine";

describe("refund state machine", () => {
  const valid: Array<[RefundStatus, RefundStatus]> = [
    ["requested", "under_review"],
    ["requested", "approved"],
    ["requested", "rejected"],
    ["under_review", "approved"],
    ["under_review", "rejected"],
    ["approved", "processing"],
    ["processing", "completed"],
    ["processing", "failed"],
    ["failed", "processing"],
  ];

  it.each(valid)("allows %s -> %s", (from, to) => {
    expect(canTransitionRefund(from, to)).toBe(true);
    expect(() => assertRefundTransition(from, to)).not.toThrow();
  });

  const invalid: Array<[RefundStatus, RefundStatus]> = [
    ["requested", "processing"],
    ["requested", "completed"],
    ["approved", "completed"],
    ["processing", "approved"],
    ["completed", "processing"],
    ["rejected", "approved"],
    ["completed", "failed"],
  ];

  it.each(invalid)("blocks %s -> %s", (from, to) => {
    expect(canTransitionRefund(from, to)).toBe(false);
    expect(() => assertRefundTransition(from, to)).toThrow(RefundTransitionError);
  });

  it("treats completed and rejected as terminal", () => {
    expect([...REFUND_TERMINAL_STATUSES].sort()).toEqual(["completed", "rejected"]);
  });

  it("allows failed -> processing for safe retry", () => {
    expect(canTransitionRefund("failed", "processing")).toBe(true);
  });
});
