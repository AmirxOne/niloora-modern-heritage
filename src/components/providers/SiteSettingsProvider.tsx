"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PublicSiteSettings } from "@/lib/site-settings/types";
import { fa } from "@/lib/i18n/fa";
import { resolveBrandLogoUrl } from "@/lib/brand/assets";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/site-settings/defaults";

function buildFallbackSettings(): PublicSiteSettings {
  return {
    brandName: fa.brand.name,
    brandTagline: fa.brand.tagline,
    shortDescription: fa.footer.description,
    logoUrl: resolveBrandLogoUrl(null),
    contactPhone: fa.footer.supportPrimaryPhone,
    contactPhoneSecondary: fa.footer.supportSecondaryPhone,
    social: {
      instagram: "https://instagram.com",
      bale: "https://ble.ir",
      eita: "https://eitaa.com",
      telegram: null,
      whatsapp: null,
      twitter: null,
      youtube: null,
    },
    seo: {
      title: `${fa.brand.name} | ${fa.brand.tagline}`,
      description: fa.footer.description,
      ogImageUrl: DEFAULT_OG_IMAGE_PATH,
    },
    services: {
      paymentGateway: { enabled: true, provider: "zarinpal", configured: false },
      sms: { enabled: true, provider: "kavenegar", configured: false },
    },
  };
}

const SiteSettingsContext = createContext<PublicSiteSettings>(buildFallbackSettings());

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: PublicSiteSettings;
  children: React.ReactNode;
}) {
  const [value, setValue] = useState(settings);

  useEffect(() => {
    setValue(settings);
  }, [settings]);

  useEffect(() => {
    const reload = async () => {
      try {
        const response = await fetch("/api/site-settings");
        if (!response.ok) return;
        const data = (await response.json()) as { settings?: PublicSiteSettings };
        if (data.settings) setValue(data.settings);
      } catch {
        // ignore
      }
    };
    window.addEventListener("site-settings-updated", reload);
    return () => window.removeEventListener("site-settings-updated", reload);
  }, []);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): PublicSiteSettings {
  return useContext(SiteSettingsContext);
}
