import { DISCOUNT_COUNTDOWN } from "@/lib/discounts-config";

export type DiscountRemaining = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function resolveDiscountEndsAt(productId?: string): Date | null {
  if (!DISCOUNT_COUNTDOWN.enabled) return null;
  const raw =
    (productId ? DISCOUNT_COUNTDOWN.perProductEndsAt[productId] : undefined) ??
    DISCOUNT_COUNTDOWN.defaultEndsAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getDiscountRemaining(endsAt: Date, now = Date.now()): DiscountRemaining {
  const totalMs = Math.max(0, endsAt.getTime() - now);
  const expired = totalMs <= 0;
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);

  return { totalMs, days, hours, minutes, seconds, expired };
}
