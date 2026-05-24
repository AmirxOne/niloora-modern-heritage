import { notFound } from "next/navigation";
import { isSupportedLocale, localeDirection, type AppLocale } from "@/lib/i18n/locales";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale) || locale === "fa") {
    notFound();
  }
  const dir = localeDirection(locale as AppLocale);

  return (
    <section lang={locale} dir={dir} className="locale-root">
      {children}
    </section>
  );
}
