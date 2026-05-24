import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedSimplePage } from "@/components/locale/LocalizedSimplePage";
import { buildPageMetadata } from "@/lib/seo/site";
import { getLocaleDictionary, isSupportedLocale, type AppLocale } from "@/lib/i18n/locales";

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
    title: dict.pages.home.title,
    description: dict.pages.home.description,
    path: "/",
    locale: locale as AppLocale,
  });
}

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale) || locale === "fa") notFound();
  return <LocalizedSimplePage locale={locale as AppLocale} kind="home" />;
}
