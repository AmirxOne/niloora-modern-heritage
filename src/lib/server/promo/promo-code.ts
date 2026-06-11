import type { PromoCode as PrismaPromoCode } from "@prisma/client";
import type { PromoCodeDefinition } from "@/lib/types";

export const PROMO_TYPES = ["percent", "fixed"] as const;
export type PromoType = (typeof PROMO_TYPES)[number];

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function parsePromoAliases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? normalizePromoCode(entry) : ""))
    .filter(Boolean);
}

export function toPromoDefinition(row: PrismaPromoCode): PromoCodeDefinition {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    type: row.type as PromoCodeDefinition["type"],
    value: row.value,
    minSubtotal: row.minSubtotal,
    replacesSiteWide: row.replacesSiteWide,
    maxUses: row.maxUses ?? null,
    usedCount: row.usedCount ?? 0,
  };
}

export type AdminPromoCodeRecord = PromoCodeDefinition & {
  active: boolean;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
};

export function toAdminPromoRecord(row: PrismaPromoCode): AdminPromoCodeRecord {
  return {
    ...toPromoDefinition(row),
    active: row.active,
    aliases: parsePromoAliases(row.aliases),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export { calcPromoDiscountAmount } from "@/lib/promo-utils";

export type PromoValidationResult =
  | { ok: true; promo: PromoCodeDefinition }
  | { ok: false; reason: "not_found" | "min_order" | "inactive" | "exhausted" };

export function validatePromoDefinition(
  promo: PromoCodeDefinition | null,
  subtotalSale: number,
  active = true
): PromoValidationResult {
  if (!promo) return { ok: false, reason: "not_found" };
  if (!active) return { ok: false, reason: "inactive" };
  if (
    promo.maxUses != null &&
    promo.maxUses > 0 &&
    (promo.usedCount ?? 0) >= promo.maxUses
  ) {
    return { ok: false, reason: "exhausted" };
  }
  if (subtotalSale < promo.minSubtotal) return { ok: false, reason: "min_order" };
  return { ok: true, promo };
}
