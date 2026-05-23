"use client";

import Link from "next/link";
import { ArrowUpLeft } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
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
      { href: "/about#craftsmanship",        label: fa.footer.craftsmanship },
      { href: "/blog",                       label: fa.nav.blog },
      { href: "/account",                    label: fa.footer.myAccount },
    ],
  },
  {
    title: fa.footer.support,
    links: [
      { href: "/faq",      label: fa.footer.faq },
      { href: "/terms",    label: fa.footer.terms },
      { href: "/privacy",  label: fa.footer.privacy },
      { href: "/returns",  label: fa.footer.returns },
      { href: "/support",  label: fa.footer.supportRequest },
    ],
  },
];

export function Footer() {
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
            className="inline-flex items-center text-xl font-bold text-[#2C2A29] transition-colors hover:text-[#B8860B] md:text-2xl"
          >
            {fa.brand.name}
          </Link>
          <button type="button" onClick={scrollToTop} className="footer-bazaar-top-btn">
            <span>{fa.footer.backToTop}</span>
            <ArrowUpLeft size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          </button>
        </div>

        <div className="footer-bazaar-support-row">
          <p>{`تلفن پشتیبانی ${fa.footer.supportPrimaryPhone}`}</p>
          <span className="footer-bazaar-support-sep" aria-hidden>
            |
          </span>
          <p dir="ltr">{fa.footer.supportSecondaryPhone}</p>
          <span className="footer-bazaar-support-sep" aria-hidden>
            |
          </span>
          <p>{fa.footer.supportHours}</p>
        </div>

        <SalesTrustStrip className="footer-bazaar-trust" />

        {/* ── شبکه 4 ستونه ── */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ستون برند */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block text-2xl font-bold text-[#2C2A29] hover:text-[#B8860B] transition-colors">
              {fa.brand.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#78716C]">
              {fa.footer.description}
            </p>
            <p className="mt-2 text-sm font-medium text-[#B8860B]">{fa.brand.tagline}</p>

            {/* اینستاگرام */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام نیلورا"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E1DB] text-[#78716C] transition-all hover:border-[#B8860B] hover:text-[#B8860B]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0" />
                </svg>
              </a>
            </div>
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
          <p>{fa.footer.copyright(new Date().getFullYear())}</p>
          <p className="tracking-wider opacity-60">{fa.footer.cities}</p>
        </div>
      </div>
    </footer>
  );
}
