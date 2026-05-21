/** Max products in compare tray (inclusive UX limit). */
export const MAX_COMPARE_PRODUCTS = 4;

/** Max recently viewed entries (most recent first). */
export const MAX_RECENTLY_VIEWED = 12;

export function pushUniqueProductId(ids: string[], productId: string, max: number): string[] {
  const next = [productId, ...ids.filter((id) => id !== productId)];
  return next.slice(0, max);
}
