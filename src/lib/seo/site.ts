import type { Metadata, Viewport } from "next";
import { fa } from "@/lib/i18n/fa";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_OG_IMAGE = "/Picsart_26-04-26_15-15-33-128.jpg";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE);
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

export function rootSiteMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const defaultTitle = `${fa.brand.name} | ${fa.brand.tagline}`;
  const defaultDescription =
    "گالری انگشترهای دست‌ساز ابراهیم آذری — سفارشی‌سازی رکاب و نگین، قلم‌کاری و خوشنویسی با استاندارد کارگاه.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${fa.brand.name}`,
    },
    description: defaultDescription,
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: fa.brand.name,
      title: defaultTitle,
      description: defaultDescription,
      url: siteUrl,
      images: [{ url: getDefaultOgImageUrl(), alt: fa.brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [getDefaultOgImageUrl()],
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
};

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image ? absoluteUrl(input.image) : getDefaultOgImageUrl();

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: input.ogType ?? "website",
      locale: "fa_IR",
      siteName: fa.brand.name,
      url,
      title: input.title,
      description: input.description,
      images: [{ url: image, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
