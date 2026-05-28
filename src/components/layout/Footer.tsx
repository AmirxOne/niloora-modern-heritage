"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { brandMarkSizes } from "@/lib/brand/assets";
import { ArrowUpLeft } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
import { FooterSocialLinks } from "@/components/layout/FooterSocialLinks";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

const COLS = [
  {
    title: fa.footer.collection,
    links: [
      { href: "/shop",      label: fa.footer.allRings },
      { href: "/shop?collection=royal-heritage", label: fa.footer.royalHeritage },
      { href: "/customize", label: fa.footer.customAtelier },
      { href: "/pre-owned", label: fa.nav.preOwned },
    ],
  },
  {
    title: fa.footer.house,
    links: [
      { href: "/about",                      label: fa.footer.ourStory },
      { href: "/artisans",                   label: fa.footer.artisans },
      { href: "/about#craftsmanship",        label: fa.footer.craftsmanship },
      { href: "/blog",                       label: fa.nav.blog },
      { href: "/account",                    label: fa.footer.myAccount },
    ],
  },
  {
    title: fa.footer.support,
    links: [
      { href: "/stones",   label: "دانشنامه سنگ‌ها" },
      { href: "/workshop-transparency", label: "شفافیت کارگاه" },
      { href: "/faq",      label: fa.footer.faq },
      { href: "/terms",    label: fa.footer.terms },
      { href: "/privacy",  label: fa.footer.privacy },
      { href: "/returns",  label: fa.footer.returns },
      { href: "/support",  label: fa.footer.supportRequest },
    ],
  },
];

export function Footer() {
  const site = useSiteSettings();

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-bazaar w-full">
      <div className="mx-auto max-w-[1639px] px-4 py-14 md:px-8 md:py-20">
        <div className="footer-bazaar-head">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold leading-none text-[#2C2A29] transition-colors hover:text-[#B8860B] md:text-2xl"
          >
            <BrandMark size={brandMarkSizes.footer} />
            <span>{site.brandName}</span>
          </Link>
          <button type="button" onClick={scrollToTop} className="footer-bazaar-top-btn">
            <span>{fa.footer.backToTop}</span>
            <ArrowUpLeft size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          </button>
        </div>

        <div className="footer-bazaar-support-row">
          {site.contactPhone ? <p>{`تلفن پشتیبانی ${site.contactPhone}`}</p> : null}
          {site.contactPhone && site.contactPhoneSecondary ? (
            <span className="footer-bazaar-support-sep" aria-hidden>
              |
            </span>
          ) : null}
          {site.contactPhoneSecondary ? (
            <p dir="ltr">{site.contactPhoneSecondary}</p>
          ) : null}
          {(site.contactPhone || site.contactPhoneSecondary) ? (
            <span className="footer-bazaar-support-sep" aria-hidden>
              |
            </span>
          ) : null}
          <p>{fa.footer.supportHours}</p>
        </div>

        <SalesTrustStrip className="footer-bazaar-trust" />

        {/* ── شبکه 4 ستونه ── */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ستون برند */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold leading-none text-[#2C2A29] transition-colors hover:text-[#B8860B]"
            >
              <BrandMark size={brandMarkSizes.footerProminent} />
              <span>{site.brandName}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#78716C]">
              {site.shortDescription ?? fa.footer.description}
            </p>
            <p className="mt-2 text-sm font-medium text-[#B8860B]">{site.brandTagline}</p>

            <FooterSocialLinks social={site.social} className="mt-6" />
          </div>

          {/* ستون‌های لینک */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B8860B]">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#78716C] transition-colors hover:text-[#2C2A29]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── خط جداکننده ── */}
        <div className="my-10 h-px bg-gradient-to-l from-transparent via-[rgba(184,134,11,0.3)] to-transparent" />

        {/* ── ردیف پایین ── */}
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-[#78716C] sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.brandName} · تمامی حقوق محفوظ است
          </p>
          <p className="tracking-wider opacity-60">{fa.footer.cities}</p>
        </div>
      </div>
    </footer>
  );
}
