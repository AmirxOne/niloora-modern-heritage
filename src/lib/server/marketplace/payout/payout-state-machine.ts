import type { PayoutStatus } from "@prisma/client";

/**
 * Allowed payout lifecycle transitions.
 *
 *   pending    -> approved | rejected
 *   approved   -> processing | rejected
 *   processing -> completed | failed
 *   rejected   -> (terminal)
 *   completed  -> (terminal)
 *   failed     -> (terminal; retry via a new payout request)
 */
export const PAYOUT_TRANSITIONS: Record<PayoutStatus, readonly PayoutStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["completed", "failed"],
  rejected: [],
  completed: [],
  failed: [],
};

export const PAYOUT_TERMINAL_STATUSES: readonly PayoutStatus[] = [
  "rejected",
  "completed",
  "failed",
];

/** Transitions that detach claimed settlements back to the payable pool. */
export const PAYOUT_REFUNDING_STATUSES: readonly PayoutStatus[] = ["rejected", "failed"];

export class PayoutTransitionError extends Error {
  code = "payout_invalid_transition";
  from: PayoutStatus;
  to: PayoutStatus;

  constructor(from: PayoutStatus, to: PayoutStatus) {
    super(`Invalid payout transition: ${from} -> ${to}`);
    this.name = "PayoutTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransitionPayout(from: PayoutStatus, to: PayoutStatus): boolean {
  return PAYOUT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPayoutTransition(from: PayoutStatus, to: PayoutStatus): void {
  if (!canTransitionPayout(from, to)) {
    throw new PayoutTransitionError(from, to);
  }
}
