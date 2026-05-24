import Link from "next/link";
import { getLocaleDictionary, localePath, type AppLocale } from "@/lib/i18n/locales";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

type PageKind = "home" | "shop" | "blog" | "about";

export function LocalizedSimplePage({
  locale,
  kind,
}: {
  locale: AppLocale;
  kind: PageKind;
}) {
  const dict = getLocaleDictionary(locale);
  const heading =
    kind === "home" ? dict.pages.home.hero : kind === "shop" ? dict.pages.shop.heading : kind === "blog" ? dict.pages.blog.heading : dict.pages.about.heading;
  const subtitle =
    kind === "home" ? dict.pages.home.lead : kind === "shop" ? dict.pages.shop.subtitle : kind === "blog" ? dict.pages.blog.subtitle : dict.pages.about.body;

  return (
    <main className="locale-simple-page">
      <div className="site-container py-12 md:py-16">
        <div className="locale-simple-topbar">
          <LocaleSwitcher />
        </div>

        <header className="locale-simple-head">
          <p className="locale-simple-eyebrow">{dict.pages.home.hero}</p>
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </header>

        {kind === "home" ? (
          <section className="locale-simple-actions">
            <Link href={localePath(locale, "/shop")}>{dict.pages.home.shopCta}</Link>
            <Link href={localePath(locale, "/blog")}>{dict.pages.home.blogCta}</Link>
            <Link href={localePath(locale, "/about")}>{dict.pages.home.aboutCta}</Link>
          </section>
        ) : null}

        {kind === "about" ? (
          <section className="locale-simple-body">
            <h2>{dict.pages.about.craftsmanshipTitle}</h2>
            <p>{dict.pages.about.body}</p>
            <p>{dict.pages.about.craftsmanshipBody}</p>
          </section>
        ) : null}

        <footer className="locale-simple-footer">
          <Link href="/">{dict.common.backToMainFa}</Link>
        </footer>
      </div>
    </main>
  );
}
