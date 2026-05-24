import { normalizeIranPhone } from "@/lib/auth/phone";
import type { BackInStockAlertChannel, BackInStockAlertStatus } from "@/lib/types";

export const BACK_IN_STOCK_ALERT_CHANNELS = ["sms", "email"] as const;
export const BACK_IN_STOCK_ALERT_STATUSES = [
  "pending",
  "sent",
  "failed",
  "cancelled",
] as const;

export function isBackInStockChannel(value: string): value is BackInStockAlertChannel {
  return (BACK_IN_STOCK_ALERT_CHANNELS as readonly string[]).includes(value);
}

export function isBackInStockStatus(value: string): value is BackInStockAlertStatus {
  return (BACK_IN_STOCK_ALERT_STATUSES as readonly string[]).includes(value);
}

export function normalizeBackInStockContact(
  channel: BackInStockAlertChannel,
  contact: string
): string | null {
  const raw = contact.trim();
  if (!raw) return null;
  if (channel === "sms") {
    return normalizeIranPhone(raw);
  }
  const email = raw.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function canCreateBackInStockAlert(availability: string): boolean {
  return availability === "sold" || availability === "preorder";
}
