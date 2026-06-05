import { randomBytes } from "node:crypto";
import {
  GIFT_CARD_MAX_PURCHASE_AMOUNT,
  GIFT_CARD_MIN_PURCHASE_AMOUNT,
  normalizeGiftCardCode,
} from "@/lib/gift-card/constants";

export { GIFT_CARD_MAX_PURCHASE_AMOUNT, GIFT_CARD_MIN_PURCHASE_AMOUNT, normalizeGiftCardCode };

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
