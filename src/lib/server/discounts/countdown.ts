import {
  fallbackDiscountCountdownConfig,
  type DiscountCountdownConfig,
} from "@/lib/discounts/countdown-shared";
import { prisma } from "@/lib/server/prisma";

export type { DiscountCountdownConfig } from "@/lib/discounts/countdown-shared";

export { fallbackDiscountCountdownConfig } from "@/lib/discounts/countdown-shared";

export async function getDiscountCountdownConfig(): Promise<DiscountCountdownConfig> {
  const row = await prisma.homeBannerSettings.findUnique({ where: { id: "default" } });
  if (!row) return fallbackDiscountCountdownConfig();

  return {
    enabled: row.countdownEnabled,
    defaultEndsAt: row.countdownEndsAt?.toISOString() ?? null,
  };
}

export function parseDiscountEndsAtInput(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
