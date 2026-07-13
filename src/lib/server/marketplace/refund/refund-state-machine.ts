import type { RefundStatus } from "@prisma/client";

/**
 * Allowed refund lifecycle transitions.
 *
 *   requested    -> under_review | approved | rejected
 *   under_review -> approved | rejected
 *   approved     -> processing
 *   processing   -> completed | failed
 *   rejected     -> (terminal)
 *   completed    -> (terminal)
 *   failed       -> processing  (safe retry of the money movement)
 */
export const REFUND_TRANSITIONS: Record<RefundStatus, readonly RefundStatus[]> = {
  requested: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["processing"],
  processing: ["completed", "failed"],
  rejected: [],
  completed: [],
  failed: ["processing"],
};

export const REFUND_TERMINAL_STATUSES: readonly RefundStatus[] = ["rejected", "completed"];

export class RefundTransitionError extends Error {
  code = "refund_invalid_transition";
  from: RefundStatus;
  to: RefundStatus;

  constructor(from: RefundStatus, to: RefundStatus) {
    super(`Invalid refund transition: ${from} -> ${to}`);
    this.name = "RefundTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransitionRefund(from: RefundStatus, to: RefundStatus): boolean {
  return REFUND_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertRefundTransition(from: RefundStatus, to: RefundStatus): void {
  if (!canTransitionRefund(from, to)) {
    throw new RefundTransitionError(from, to);
  }
}
