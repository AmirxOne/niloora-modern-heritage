import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedSimplePage } from "@/components/locale/LocalizedSimplePage";
import { getLocaleDictionary, isSupportedLocale, type AppLocale } from "@/lib/i18n/locales";
import { buildPageMetadata } from "@/lib/seo/site";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale) || locale === "fa") {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }
  const dict = getLocaleDictionary(locale as AppLocale);
  return buildPageMetadata({
    title: dict.pages.shop.title,
    description: dict.pages.shop.description,
    path: "/shop",
    locale: locale as AppLocale,
  });
}

export default async function LocalizedShopPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale) || locale === "fa") notFound();
  return <LocalizedSimplePage locale={locale as AppLocale} kind="shop" />;
}
