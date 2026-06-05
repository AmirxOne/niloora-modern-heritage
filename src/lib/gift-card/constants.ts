export const GIFT_CARD_MIN_PURCHASE_AMOUNT = 100_000;
export const GIFT_CARD_MAX_PURCHASE_AMOUNT = 500_000_000;

export function normalizeGiftCardCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, "");
}
