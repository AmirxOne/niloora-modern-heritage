import type { SiteSocialLinks } from "@/lib/site-settings/types";
import { fa } from "@/lib/i18n/fa";

export type SiteSocialKey = keyof SiteSocialLinks;

export const FOOTER_SOCIAL_ORDER: SiteSocialKey[] = [
  "instagram",
  "bale",
  "eita",
  "telegram",
  "whatsapp",
  "youtube",
  "twitter",
];

export const FOOTER_SOCIAL_LABELS: Record<SiteSocialKey, string> = {
  instagram: fa.admin.settings.socialInstagram,
  bale: fa.admin.settings.socialBale,
  eita: fa.admin.settings.socialEita,
  telegram: fa.admin.settings.socialTelegram,
  whatsapp: fa.admin.settings.socialWhatsapp,
  twitter: fa.admin.settings.socialTwitter,
  youtube: fa.admin.settings.socialYoutube,
};
