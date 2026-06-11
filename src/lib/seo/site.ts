import type { Metadata, Viewport } from "next";
import { BRAND_MARK_PATH } from "@/lib/brand/assets";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/site-settings/defaults";
import type { PublicSiteSettings } from "@/lib/site-settings/types";
import { DEFAULT_LOCALE, localePath, type AppLocale } from "@/lib/i18n/locales";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_OG_IMAGE = DEFAULT_OG_IMAGE_PATH;

let warnedMissingSiteUrl = false;

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production" && !warnedMissingSiteUrl) {
    warnedMissingSiteUrl = true;
    // Canonical/OG URLs would otherwise point at localhost in production.
    console.warn(
      "[seo] NEXT_PUBLIC_SITE_URL is not set — canonical and Open Graph URLs will fall back to localhost. Set it before deploying."
    );
  }
  return (configured || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getDefaultOgImageUrl(ogImagePath = DEFAULT_OG_IMAGE): string {
  const path = ogImagePath.startsWith("/") ? ogImagePath : `/${ogImagePath}`;
  return absoluteUrl(path);
}

/**
 * Viewport و theme-color جداگانه از metadata
 * تا حس اپ موبایل native (status bar هم‌رنگ، notch، فول‌اسکرین) داشته باشیم.
 */
export const rootSiteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFCF7" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1817" },
  ],
};

export function rootSiteMetadata(settings: PublicSiteSettings): Metadata {
  const siteUrl = getSiteUrl();
  const defaultTitle = settings.seo.title;
  const defaultDescription = settings.seo.description;
  const ogImage = getDefaultOgImageUrl(settings.seo.ogImageUrl);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${settings.brandName}`,
    },
    description: defaultDescription,
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: settings.brandName,
      title: defaultTitle,
      description: defaultDescription,
      url: siteUrl,
      images: [{ url: ogImage, alt: settings.brandName }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: absoluteUrl("/"),
    },
    icons: {
      icon: [{ url: BRAND_MARK_PATH, type: "image/png" }],
      apple: [{ url: BRAND_MARK_PATH, type: "image/png" }],
      shortcut: BRAND_MARK_PATH,
    },
  };
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  ogType?: "website" | "article";
  locale?: AppLocale;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  };
};

export function buildPageMetadata(
  input: PageMetaInput,
  settings?: Pick<PublicSiteSettings, "brandName" | "seo">
): Metadata {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const localizedPath = localePath(locale, input.path);
  const url = absoluteUrl(localizedPath);
  const image = input.image
    ? absoluteUrl(input.image)
    : getDefaultOgImageUrl(settings?.seo.ogImageUrl);
  const ogLocale = locale === "fa" ? "fa_IR" : locale === "ar" ? "ar_SA" : "en_US";
  const siteName = settings?.brandName ?? "Niloora";

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: input.ogType ?? "website",
      locale: ogLocale,
      siteName,
      url,
      title: input.title,
      description: input.description,
      images: [{ url: image, alt: input.title }],
      ...(input.ogType === "article" && input.article
        ? {
            publishedTime: input.article.publishedTime,
            modifiedTime: input.article.modifiedTime,
            authors: input.article.authors,
            tags: input.article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
