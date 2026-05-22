import { DISCOUNT_COUNTDOWN } from "@/lib/discounts-config";

export type DiscountCountdownConfig = {
  enabled: boolean;
  defaultEndsAt: string | null;
};

function parseIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function fallbackDiscountCountdownConfig(): DiscountCountdownConfig {
  return {
    enabled: DISCOUNT_COUNTDOWN.enabled,
    defaultEndsAt: parseIsoDate(DISCOUNT_COUNTDOWN.defaultEndsAt),
  };
}

export function resolveDiscountEndsAtFromConfig(
  config: DiscountCountdownConfig | null | undefined,
  productEndsAt?: string | null
): Date | null {
  const enabled = config?.enabled ?? DISCOUNT_COUNTDOWN.enabled;
  if (!enabled) return null;

  const raw =
    parseIsoDate(productEndsAt) ??
    config?.defaultEndsAt ??
    parseIsoDate(DISCOUNT_COUNTDOWN.defaultEndsAt);
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
