import { cache } from "react";
import { Prisma } from "@prisma/client";
import type { SiteSettings } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { serverEnv } from "@/lib/server/env";
import { resolveBrandLogoUrl } from "@/lib/brand/assets";
import { DEFAULT_OG_IMAGE_PATH, resolvePublicImagePath } from "@/lib/images";
import { buildDefaultSiteSettingsRecord, SITE_SETTINGS_ID } from "@/lib/site-settings/defaults";
import type { AdminSiteSettings, PublicSiteSettings } from "@/lib/site-settings/types";

function mapRowToPublic(row: SiteSettings): PublicSiteSettings {
  const seoTitle = row.seoTitle?.trim() || `${row.brandName} | ${row.brandTagline}`;
  const seoDescription =
    row.seoDescription?.trim() ||
    row.shortDescription?.trim() ||
    buildDefaultSiteSettingsRecord().seoDescription;

  const merchantId =
    row.zarinpalMerchantId?.trim() || serverEnv.zarinpalMerchantId || "";
  const smsConfigured =
    row.smsProvider === "kavenegar" && Boolean(serverEnv.kavenegarApiKey);

  return {
    brandName: row.brandName,
    brandTagline: row.brandTagline,
    shortDescription: row.shortDescription,
    logoUrl: resolveBrandLogoUrl(row.logoUrl),
    contactPhone: row.contactPhone,
    contactPhoneSecondary: row.contactPhoneSecondary,
    social: {
      instagram: row.socialInstagram,
      bale: row.socialBale,
      eita: row.socialEita,
      telegram: row.socialTelegram,
      whatsapp: row.socialWhatsapp,
      twitter: row.socialTwitter,
      youtube: row.socialYoutube,
    },
    seo: {
      title: seoTitle,
      description: seoDescription,
      ogImageUrl: resolvePublicImagePath(row.seoOgImageUrl, DEFAULT_OG_IMAGE_PATH),
    },
    enamadHtml: row.enamadHtml?.trim() || null,
    services: {
      paymentGateway: {
        enabled: row.paymentGatewayEnabled,
        provider: row.paymentProvider,
        configured: Boolean(merchantId),
      },
      sms: {
        enabled: row.smsEnabled,
        provider: row.smsProvider,
        configured: smsConfigured,
      },
    },
  };
}

export function toAdminSiteSettingsDto(row: SiteSettings): AdminSiteSettings {
  const publicSettings = mapRowToPublic(row);
  const merchantFromEnv =
    !row.zarinpalMerchantId?.trim() && Boolean(serverEnv.zarinpalMerchantId);

  return {
    ...publicSettings,
    payment: {
      enabled: row.paymentGatewayEnabled,
      provider: row.paymentProvider,
      zarinpalMerchantId: row.zarinpalMerchantId,
      zarinpalSandbox: row.zarinpalSandbox,
      merchantFromEnv,
    },
    sms: {
      enabled: row.smsEnabled,
      provider: row.smsProvider,
      apiKeyFromEnv: Boolean(serverEnv.kavenegarApiKey),
    },
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isMissingSiteSettingsTable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021";
  }
  if (error instanceof Error) {
    return (
      error.message.includes("SiteSettings") && error.message.includes("does not exist")
    );
  }
  return false;
}

function isMissingSiteSettingsColumn(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2022";
  }
  if (error instanceof Error) {
    return (
      error.message.includes("SiteSettings") &&
      error.message.includes("does not exist in the current database")
    );
  }
  return false;
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "ECONNREFUSED";
  }
  if (error instanceof Error) {
    return (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("Can't reach database server") ||
      error.message.includes("P1001")
    );
  }
  return false;
}

function defaultSiteSettingsRow(): SiteSettings {
  return {
    ...buildDefaultSiteSettingsRecord(),
    updatedAt: new Date(),
  };
}

async function ensureSiteSettingsRow(): Promise<SiteSettings> {
  try {
    const existing = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });
    if (existing) return existing;

    const defaults = buildDefaultSiteSettingsRecord();
    return await prisma.siteSettings.create({
      data: {
        ...defaults,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.warn(
        "[site-settings] Database unavailable — using defaults. Check DATABASE_URL and ensure Postgres is running."
      );
      return defaultSiteSettingsRow();
    }
    if (isMissingSiteSettingsTable(error)) {
      console.warn(
        "[site-settings] SiteSettings table missing — using defaults. Run: npx prisma migrate deploy"
      );
      return defaultSiteSettingsRow();
    }
    if (isMissingSiteSettingsColumn(error)) {
      console.warn(
        "[site-settings] SiteSettings columns out of date — using defaults. Run: npx prisma migrate deploy"
      );
      return defaultSiteSettingsRow();
    }
    throw error;
  }
}

export const getSiteSettingsRow = cache(async (): Promise<SiteSettings> => {
  return ensureSiteSettingsRow();
});

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  const row = await getSiteSettingsRow();
  return mapRowToPublic(row);
});

export const getAdminSiteSettings = cache(async (): Promise<AdminSiteSettings> => {
  const row = await getSiteSettingsRow();
  return toAdminSiteSettingsDto(row);
});

export type UpdateSiteSettingsInput = {
  brandName?: string;
  brandTagline?: string;
  shortDescription?: string | null;
  logoUrl?: string | null;
  contactPhone?: string | null;
  contactPhoneSecondary?: string | null;
  socialInstagram?: string | null;
  socialBale?: string | null;
  socialEita?: string | null;
  socialTelegram?: string | null;
  socialWhatsapp?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoOgImageUrl?: string | null;
  enamadHtml?: string | null;
  paymentGatewayEnabled?: boolean;
  paymentProvider?: string;
  zarinpalMerchantId?: string | null;
  zarinpalSandbox?: boolean;
  smsEnabled?: boolean;
  smsProvider?: string;
};

function normalizeOptionalUrl(raw: string | null | undefined): string | null | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return trimmed;
  } catch {
    return null;
  }
  return null;
}

export async function updateSiteSettings(input: UpdateSiteSettingsInput) {
  try {
    await ensureSiteSettingsRow();
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      throw new Error(
        "اتصال به پایگاه داده برقرار نشد. بررسی کنید PostgreSQL روشن باشد و DATABASE_URL صحیح باشد."
      );
    }
    if (isMissingSiteSettingsTable(error)) {
      throw new Error(
        "جدول تنظیمات سایت در پایگاه داده وجود ندارد. دستور npx prisma migrate deploy را اجرا کنید."
      );
    }
    if (isMissingSiteSettingsColumn(error)) {
      throw new Error(
        "ستون‌های جدید جدول تنظیمات سایت در پایگاه داده اعمال نشده‌اند. دستور npx prisma migrate deploy را اجرا کنید."
      );
    }
    throw error;
  }

  const data: UpdateSiteSettingsInput = { ...input };

  if (data.logoUrl !== undefined) {
    const normalizedLogoUrl = normalizeOptionalUrl(data.logoUrl);
    data.logoUrl = normalizedLogoUrl ? resolveBrandLogoUrl(normalizedLogoUrl) : null;
  }
  if (data.seoOgImageUrl !== undefined) {
    data.seoOgImageUrl = normalizeOptionalUrl(data.seoOgImageUrl) ?? null;
  }
  for (const key of [
    "socialInstagram",
    "socialBale",
    "socialEita",
    "socialTelegram",
    "socialWhatsapp",
    "socialTwitter",
    "socialYoutube",
  ] as const) {
    if (data[key] !== undefined) {
      data[key] = normalizeOptionalUrl(data[key]) ?? null;
    }
  }

  if (data.brandName !== undefined && !data.brandName.trim()) {
    throw new Error("نام برند الزامی است.");
  }
  if (data.brandTagline !== undefined && !data.brandTagline.trim()) {
    throw new Error("توضیح کوتاه برند الزامی است.");
  }

  let row: SiteSettings;
  try {
    row = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      ...(data.brandName !== undefined ? { brandName: data.brandName.trim() } : {}),
      ...(data.brandTagline !== undefined ? { brandTagline: data.brandTagline.trim() } : {}),
      ...(data.shortDescription !== undefined
        ? { shortDescription: data.shortDescription?.trim() || null }
        : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.contactPhone !== undefined
        ? { contactPhone: data.contactPhone?.trim() || null }
        : {}),
      ...(data.contactPhoneSecondary !== undefined
        ? { contactPhoneSecondary: data.contactPhoneSecondary?.trim() || null }
        : {}),
      ...(data.socialInstagram !== undefined ? { socialInstagram: data.socialInstagram } : {}),
      ...(data.socialBale !== undefined ? { socialBale: data.socialBale } : {}),
      ...(data.socialEita !== undefined ? { socialEita: data.socialEita } : {}),
      ...(data.socialTelegram !== undefined ? { socialTelegram: data.socialTelegram } : {}),
      ...(data.socialWhatsapp !== undefined ? { socialWhatsapp: data.socialWhatsapp } : {}),
      ...(data.socialTwitter !== undefined ? { socialTwitter: data.socialTwitter } : {}),
      ...(data.socialYoutube !== undefined ? { socialYoutube: data.socialYoutube } : {}),
      ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle?.trim() || null } : {}),
      ...(data.seoDescription !== undefined
        ? { seoDescription: data.seoDescription?.trim() || null }
        : {}),
      ...(data.seoOgImageUrl !== undefined ? { seoOgImageUrl: data.seoOgImageUrl } : {}),
      ...(data.enamadHtml !== undefined ? { enamadHtml: data.enamadHtml?.trim() || null } : {}),
      ...(data.paymentGatewayEnabled !== undefined
        ? { paymentGatewayEnabled: data.paymentGatewayEnabled }
        : {}),
      ...(data.paymentProvider !== undefined
        ? { paymentProvider: data.paymentProvider.trim() || "zarinpal" }
        : {}),
      ...(data.zarinpalMerchantId !== undefined
        ? { zarinpalMerchantId: data.zarinpalMerchantId?.trim() || null }
        : {}),
      ...(data.zarinpalSandbox !== undefined ? { zarinpalSandbox: data.zarinpalSandbox } : {}),
      ...(data.smsEnabled !== undefined ? { smsEnabled: data.smsEnabled } : {}),
      ...(data.smsProvider !== undefined
        ? { smsProvider: data.smsProvider.trim() || "kavenegar" }
        : {}),
    },
  });
  } catch (error) {
    if (isMissingSiteSettingsTable(error)) {
      throw new Error(
        "جدول تنظیمات سایت در پایگاه داده وجود ندارد. دستور npx prisma migrate deploy را اجرا کنید."
      );
    }
    if (isMissingSiteSettingsColumn(error)) {
      throw new Error(
        "ستون‌های جدید جدول تنظیمات سایت در پایگاه داده اعمال نشده‌اند. دستور npx prisma migrate deploy را اجرا کنید."
      );
    }
    throw error;
  }

  return toAdminSiteSettingsDto(row);
}
