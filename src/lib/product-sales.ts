export function buildDefaultProductSales(): Record<string, number> {
  return {};
}

export function mergeProductSales(
  stored: Record<string, number> | null | undefined
): Record<string, number> {
  const defaults = buildDefaultProductSales();
  if (!stored) return defaults;

  const merged = { ...defaults };
  for (const [id, count] of Object.entries(stored)) {
    if (typeof count === "number" && count >= 0) {
      merged[id] = Math.max(merged[id] ?? 0, count);
    }
  }
  return merged;
}
