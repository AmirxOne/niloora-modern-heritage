import { describe, expect, it } from "vitest";
import type { PayoutStatus } from "@prisma/client";
import {
  assertPayoutTransition,
  canTransitionPayout,
  PAYOUT_REFUNDING_STATUSES,
  PAYOUT_TERMINAL_STATUSES,
  PayoutTransitionError,
} from "@/lib/server/marketplace/payout/payout-state-machine";

describe("payout state machine", () => {
  const valid: Array<[PayoutStatus, PayoutStatus]> = [
    ["pending", "approved"],
    ["pending", "rejected"],
    ["approved", "processing"],
    ["approved", "rejected"],
    ["processing", "completed"],
    ["processing", "failed"],
  ];

  it.each(valid)("allows %s -> %s", (from, to) => {
    expect(canTransitionPayout(from, to)).toBe(true);
    expect(() => assertPayoutTransition(from, to)).not.toThrow();
  });

  const invalid: Array<[PayoutStatus, PayoutStatus]> = [
    ["pending", "processing"],
    ["pending", "completed"],
    ["approved", "completed"],
    ["processing", "approved"],
    ["completed", "processing"],
    ["failed", "processing"],
    ["rejected", "approved"],
    ["completed", "failed"],
  ];

  it.each(invalid)("blocks %s -> %s", (from, to) => {
    expect(canTransitionPayout(from, to)).toBe(false);
    expect(() => assertPayoutTransition(from, to)).toThrow(PayoutTransitionError);
  });

  it("marks completed/rejected/failed as terminal", () => {
    for (const status of PAYOUT_TERMINAL_STATUSES) {
      expect(canTransitionPayout(status, "approved")).toBe(false);
    }
  });

  it("refunds reserved funds only on rejected/failed", () => {
    expect([...PAYOUT_REFUNDING_STATUSES].sort()).toEqual(["failed", "rejected"]);
  });
});
