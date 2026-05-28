import { RETURN_CATEGORIES } from "@/lib/server/support-request/support-request";

export const ORDER_RETURN_STATUSES = [
  "requested",
  "under_review",
  "approved",
  "rejected",
  "refunded",
  "cancelled",
] as const;

export type OrderReturnStatus = (typeof ORDER_RETURN_STATUSES)[number];

export const ORDER_RETURN_FILTER_STATUSES = ["all", ...ORDER_RETURN_STATUSES] as const;

export type OrderReturnFilterStatus = (typeof ORDER_RETURN_FILTER_STATUSES)[number];

export const ORDER_RETURN_REASONS = RETURN_CATEGORIES;

export type OrderReturnReason = (typeof ORDER_RETURN_REASONS)[number];

export const ORDER_RETURN_INTERNAL_NOTES_MAX = 4000;
export const ORDER_RETURN_REASON_DETAIL_MAX = 4000;
export const ORDER_RETURN_STATUS_NOTE_MAX = 500;

export function isOrderReturnStatus(value: string): value is OrderReturnStatus {
  return (ORDER_RETURN_STATUSES as readonly string[]).includes(value);
}

export function isOrderReturnReason(value: string): value is OrderReturnReason {
  return (ORDER_RETURN_REASONS as readonly string[]).includes(value);
}

export function parseOrderReturnFilter(raw: string | null): OrderReturnFilterStatus {
  if (!raw || raw === "all") return "all";
  if ((ORDER_RETURN_FILTER_STATUSES as readonly string[]).includes(raw)) {
    return raw as OrderReturnFilterStatus;
  }
  return "all";
}

export function parseReturnPage(raw: string | null): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

export function parseReturnPageSize(raw: string | null): number {
  const n = Number.parseInt(raw ?? "20", 10);
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(n, 100);
}
