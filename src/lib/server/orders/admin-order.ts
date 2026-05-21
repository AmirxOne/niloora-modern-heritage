import type { Order } from "@/lib/types";

export const ADMIN_ORDER_STATUSES = [
  "processing",
  "crafting",
  "shipped",
  "delivered",
] as const;

export type AdminSettableOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export const ADMIN_ORDER_FILTER_STATUSES = [
  "all",
  "pending_payment",
  "payment_failed",
  ...ADMIN_ORDER_STATUSES,
] as const;

export type AdminOrderFilterStatus = (typeof ADMIN_ORDER_FILTER_STATUSES)[number];

export function isAdminSettableStatus(value: string): value is AdminSettableOrderStatus {
  return (ADMIN_ORDER_STATUSES as readonly string[]).includes(value);
}

export function isAdminFilterStatus(value: string | null): value is AdminOrderFilterStatus {
  if (!value || value === "all") return value === "all" || value === null;
  return (ADMIN_ORDER_FILTER_STATUSES as readonly string[]).includes(value);
}

export function parseAdminOrderFilter(
  raw: string | null
): AdminOrderFilterStatus | "all" {
  if (!raw || raw === "all") return "all";
  if (isAdminFilterStatus(raw) && raw !== "all") return raw;
  return "all";
}
