import {
  CAMPAIGN_DISCOUNT_TYPES,
  CAMPAIGN_TARGET_SCOPES,
  normalizeCampaignSlug,
  parseCampaignIdList,
  type CampaignUpsertInput,
} from "./discount-campaign";

type ParseResult = { ok: true; data: CampaignUpsertInput } | { ok: false; message: string };

function parseIdListField(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseOptionalDate(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseAdminCampaignBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "بدنهٔ درخواست نامعتبر است." };
  }
  const b = body as Record<string, unknown>;

  const slugRaw = typeof b.slug === "string" ? b.slug : "";
  const title = typeof b.title === "string" ? b.title : "";
  const slug = normalizeCampaignSlug(slugRaw || title);
  const description =
    typeof b.description === "string" && b.description.trim() ? b.description.trim() : null;
  const discountType = typeof b.discountType === "string" ? b.discountType : "";
  const discountValue = Number(b.discountValue);
  const minSubtotal = Number(b.minSubtotal ?? 0);
  const targetScope = typeof b.targetScope === "string" ? b.targetScope : "all";
  const active = b.active !== false;
  const priority = Number(b.priority ?? 0);
  const replacesSiteWide = Boolean(b.replacesSiteWide);
  const linkedPromoCodeId =
    typeof b.linkedPromoCodeId === "string" && b.linkedPromoCodeId.trim()
      ? b.linkedPromoCodeId.trim()
      : null;

  const bannerEnabled = Boolean(b.bannerEnabled);
  const bannerBadge =
    typeof b.bannerBadge === "string" && b.bannerBadge.trim() ? b.bannerBadge.trim() : null;
  const bannerTitle =
    typeof b.bannerTitle === "string" && b.bannerTitle.trim() ? b.bannerTitle.trim() : null;
  const bannerSubtitle =
    typeof b.bannerSubtitle === "string" && b.bannerSubtitle.trim()
      ? b.bannerSubtitle.trim()
      : null;
  const bannerCtaLabel =
    typeof b.bannerCtaLabel === "string" && b.bannerCtaLabel.trim()
      ? b.bannerCtaLabel.trim()
      : null;
  const bannerCtaHref =
    typeof b.bannerCtaHref === "string" && b.bannerCtaHref.trim()
      ? b.bannerCtaHref.trim()
      : null;
  const bannerImageUrl =
    typeof b.bannerImageUrl === "string" && b.bannerImageUrl.trim()
      ? b.bannerImageUrl.trim()
      : null;

  if (!slug) return { ok: false, message: "شناسهٔ URL (slug) نامعتبر است." };
  if (!title.trim()) return { ok: false, message: "عنوان کمپین الزامی است." };
  if (!CAMPAIGN_DISCOUNT_TYPES.includes(discountType as (typeof CAMPAIGN_DISCOUNT_TYPES)[number])) {
    return { ok: false, message: "نوع تخفیف باید percent یا fixed باشد." };
  }
  if (!CAMPAIGN_TARGET_SCOPES.includes(targetScope as (typeof CAMPAIGN_TARGET_SCOPES)[number])) {
    return { ok: false, message: "محدودهٔ هدف نامعتبر است." };
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, message: "مقدار تخفیف باید عدد مثبت باشد." };
  }
  if (discountType === "percent" && discountValue > 100) {
    return { ok: false, message: "درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد." };
  }
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
    return { ok: false, message: "حداقل سبد نامعتبر است." };
  }
  if (!Number.isFinite(priority)) {
    return { ok: false, message: "اولویت نامعتبر است." };
  }

  return {
    ok: true,
    data: {
      slug,
      title: title.trim(),
      description,
      discountType: discountType as CampaignUpsertInput["discountType"],
      discountValue: Math.round(discountValue),
      minSubtotal: Math.round(minSubtotal),
      targetScope: targetScope as CampaignUpsertInput["targetScope"],
      targetProductIds: parseIdListField(b.targetProductIds),
      targetCollectionIds: parseIdListField(b.targetCollectionIds),
      startsAt: parseOptionalDate(b.startsAt),
      endsAt: parseOptionalDate(b.endsAt),
      active,
      priority: Math.round(priority),
      replacesSiteWide,
      linkedPromoCodeId,
      bannerEnabled,
      bannerBadge,
      bannerTitle,
      bannerSubtitle,
      bannerCtaLabel,
      bannerCtaHref: bannerCtaHref ?? `/shop?campaign=${encodeURIComponent(slug)}`,
      bannerImageUrl,
    },
  };
}
