import { fa } from "@/lib/i18n/fa";
import { BRAND_MARK_PATH } from "@/lib/brand/assets";

export const SITE_SETTINGS_ID = "default";

export const DEFAULT_OG_IMAGE_PATH = "/Picsart_26-04-26_15-15-33-128.jpg";

export function buildDefaultSiteSettingsRecord() {
  return {
    id: SITE_SETTINGS_ID,
    brandName: fa.brand.name,
    brandTagline: fa.brand.tagline,
    shortDescription: fa.footer.description,
    logoUrl: BRAND_MARK_PATH,
    contactPhone: fa.footer.supportPrimaryPhone,
    contactPhoneSecondary: fa.footer.supportSecondaryPhone,
    socialInstagram: "https://instagram.com",
    socialBale: "https://ble.ir",
    socialEita: "https://eitaa.com",
    socialTelegram: null as string | null,
    socialWhatsapp: null as string | null,
    socialTwitter: null as string | null,
    socialYoutube: null as string | null,
    seoTitle: `${fa.brand.name} | ${fa.brand.tagline}`,
    seoDescription:
      "گالری انگشترهای دست‌ساز ابراهیم آذری — سفارشی‌سازی رکاب و نگین، قلم‌کاری و خوشنویسی با استاندارد کارگاه.",
    seoOgImageUrl: DEFAULT_OG_IMAGE_PATH,
    paymentGatewayEnabled: true,
    paymentProvider: "zarinpal",
    zarinpalMerchantId: null as string | null,
    zarinpalSandbox: true,
    smsEnabled: true,
    smsProvider: "kavenegar",
  };
}
