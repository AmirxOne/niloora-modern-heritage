import { PROMO_TYPES } from "@/lib/server/promo/promo-code";
import type { PromoCodeUpsertInput } from "@/lib/server/promo/promo-code-service";

type ParseResult = { ok: true; data: PromoCodeUpsertInput } | { ok: false; message: string };

function parseAliasesField(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v));
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseAdminPromoBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "بدنهٔ درخواست نامعتبر است." };
  }
  const b = body as Record<string, unknown>;

  const code = typeof b.code === "string" ? b.code : "";
  const label = typeof b.label === "string" ? b.label : "";
  const type = typeof b.type === "string" ? b.type : "";
  const value = Number(b.value);
  const minSubtotal = Number(b.minSubtotal ?? 0);
  const replacesSiteWide = Boolean(b.replacesSiteWide);
  const active = b.active !== false;
  const maxUsesRaw = b.maxUses;
  let maxUses: number | null = null;
  if (maxUsesRaw !== null && maxUsesRaw !== undefined && maxUsesRaw !== "") {
    const parsedMax = Number(maxUsesRaw);
    if (!Number.isFinite(parsedMax) || parsedMax < 0) {
      return { ok: false, message: "سقف استفاده نامعتبر است." };
    }
    maxUses = parsedMax > 0 ? Math.round(parsedMax) : null;
  }

  if (!code.trim()) return { ok: false, message: "کد تخفیف الزامی است." };
  if (!label.trim()) return { ok: false, message: "عنوان کد الزامی است." };
  if (!PROMO_TYPES.includes(type as (typeof PROMO_TYPES)[number])) {
    return { ok: false, message: "نوع تخفیف باید percent یا fixed باشد." };
  }
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, message: "مقدار تخفیف باید عدد مثبت باشد." };
  }
  if (type === "percent" && value > 100) {
    return { ok: false, message: "درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد." };
  }
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
    return { ok: false, message: "حداقل سبد نامعتبر است." };
  }

  return {
    ok: true,
    data: {
      code,
      label,
      type: type as PromoCodeUpsertInput["type"],
      value: Math.round(value),
      minSubtotal: Math.round(minSubtotal),
      replacesSiteWide,
      active,
      maxUses,
      aliases: parseAliasesField(b.aliases),
    },
  };
}
