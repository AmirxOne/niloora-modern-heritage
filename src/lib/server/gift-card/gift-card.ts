import { randomBytes } from "node:crypto";

export const GIFT_CARD_MIN_PURCHASE_AMOUNT = 100_000;
export const GIFT_CARD_MAX_PURCHASE_AMOUNT = 500_000_000;

export function normalizeGiftCardCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, "");
}

export function isGiftCardCodeShape(value: string): boolean {
  return /^GC-[A-Z0-9]{8}$/.test(value);
}

export function newGiftCardCode(): string {
  return `GC-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function giftCardIsExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now();
}

export function clampGiftCardPurchaseAmount(input: number): number | null {
  if (!Number.isFinite(input)) return null;
  const amount = Math.round(input);
  if (amount < GIFT_CARD_MIN_PURCHASE_AMOUNT) return null;
  if (amount > GIFT_CARD_MAX_PURCHASE_AMOUNT) return null;
  return amount;
}
