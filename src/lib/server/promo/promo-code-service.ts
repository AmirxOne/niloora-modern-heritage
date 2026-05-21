import { prisma } from "@/lib/server/prisma";
import type { PromoCodeDefinition } from "@/lib/types";
import { calcPromoDiscountAmount } from "@/lib/promo-utils";
import {
  normalizePromoCode,
  parsePromoAliases,
  toAdminPromoRecord,
  toPromoDefinition,
  validatePromoDefinition,
  type AdminPromoCodeRecord,
  type PromoValidationResult,
} from "./promo-code";

export async function resolvePromoByCode(
  raw: string
): Promise<{ promo: PromoCodeDefinition; active: boolean } | null> {
  const normalized = normalizePromoCode(raw);
  if (!normalized) return null;

  const rows = await prisma.promoCode.findMany({
    where: { active: true },
  });

  for (const row of rows) {
    const aliases = parsePromoAliases(row.aliases);
    if (row.code === normalized || aliases.includes(normalized)) {
      return { promo: toPromoDefinition(row), active: row.active };
    }
  }

  const inactiveMatch = await prisma.promoCode.findFirst({
    where: { code: normalized },
  });
  if (inactiveMatch) {
    return { promo: toPromoDefinition(inactiveMatch), active: false };
  }

  return null;
}

export async function validatePromoForCheckout(
  rawCode: string,
  subtotalSale: number
): Promise<PromoValidationResult> {
  const resolved = await resolvePromoByCode(rawCode);
  if (!resolved) return { ok: false, reason: "not_found" };
  return validatePromoDefinition(resolved.promo, subtotalSale, resolved.active);
}

export async function calcPromoFromCode(
  subtotalSale: number,
  rawCode: string | null
): Promise<{ amount: number; normalizedCode: string | null; replacesSiteWide: boolean }> {
  if (!rawCode) return { amount: 0, normalizedCode: null, replacesSiteWide: false };
  const result = await validatePromoForCheckout(rawCode, subtotalSale);
  if (!result.ok) return { amount: 0, normalizedCode: null, replacesSiteWide: false };
  return {
    amount: calcPromoDiscountAmount(subtotalSale, result.promo),
    normalizedCode: result.promo.code,
    replacesSiteWide: result.promo.replacesSiteWide,
  };
}

export async function listAdminPromoCodes(): Promise<AdminPromoCodeRecord[]> {
  const rows = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toAdminPromoRecord);
}

export type PromoCodeUpsertInput = {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  replacesSiteWide: boolean;
  active: boolean;
  aliases: string[];
};

export async function createPromoCode(input: PromoCodeUpsertInput) {
  const code = normalizePromoCode(input.code);
  const aliases = input.aliases.map(normalizePromoCode).filter((a) => a && a !== code);

  return prisma.promoCode.create({
    data: {
      code,
      label: input.label.trim(),
      type: input.type,
      value: input.value,
      minSubtotal: input.minSubtotal,
      replacesSiteWide: input.replacesSiteWide,
      active: input.active,
      aliases,
    },
  });
}

export async function updatePromoCode(id: string, input: PromoCodeUpsertInput) {
  const code = normalizePromoCode(input.code);
  const aliases = input.aliases.map(normalizePromoCode).filter((a) => a && a !== code);

  return prisma.promoCode.update({
    where: { id },
    data: {
      code,
      label: input.label.trim(),
      type: input.type,
      value: input.value,
      minSubtotal: input.minSubtotal,
      replacesSiteWide: input.replacesSiteWide,
      active: input.active,
      aliases,
    },
  });
}

export async function deletePromoCode(id: string) {
  return prisma.promoCode.delete({ where: { id } });
}
