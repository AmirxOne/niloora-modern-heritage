"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUPPORTED_LOCALES, localePath, stripLocalePrefix, type AppLocale } from "@/lib/i18n/locales";

function localeLabel(locale: AppLocale): string {
  if (locale === "fa") return "FA";
  if (locale === "ar") return "AR";
  return "EN";
}

export function LocaleSwitcher() {
  const pathname = usePathname() ?? "/";
  const { path, locale: detectedLocale } = stripLocalePrefix(pathname);

  return (
    <div className="locale-switcher" aria-label="Language switcher">
      {SUPPORTED_LOCALES.map((locale) => {
        const href = localePath(locale, path);
        const isActive = detectedLocale === locale;
        return (
          <Link
            key={locale}
            href={href}
            className="locale-switcher-link"
            data-active={isActive ? "true" : "false"}
          >
            {localeLabel(locale)}
          </Link>
        );
      })}
    </div>
  );
}
