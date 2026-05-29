"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { useSiteBanner } from "@/lib/hooks/useSiteBanner";
import {
  Compare,
  Gem,
  Menu,
  PenTool,
  Recycle,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
} from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { stripLocalePrefix } from "@/lib/i18n/locales";
import { BrandMark } from "@/components/brand/BrandMark";
import { brandMarkSizes } from "@/lib/brand/assets";
import { HeaderAccountMenuSkeleton } from "@/components/layout/HeaderAccountMenuSkeleton";
import { HeaderPromoStrip } from "@/components/layout/HeaderPromoStrip";
import { isHeaderStripVisible } from "@/lib/home-banner-header-strip";

const HeaderSearch = dynamic(
  () => import("@/components/layout/HeaderSearch").then((mod) => mod.HeaderSearch),
  { ssr: false }
);
const HeaderAccountMenu = dynamic(
  () => import("@/components/layout/HeaderAccountMenu").then((mod) => mod.HeaderAccountMenu),
  {
    ssr: false,
    loading: () => <HeaderAccountMenuSkeleton />,
  }
);

type NavIcon = React.ComponentType<{
  size?: number;
  variant?: typeof ICON_VARIANT;
}>;

const SECONDARY_NAV_FEATURED = {
  href: "/shop",
  label: fa.nav.shop,
  icon: Store as NavIcon,
};

const SECONDARY_NAV_LINKS: Array<{ href: string; label: string; icon: NavIcon }> = [
  { href: "/customize", label: fa.nav.customize, icon: PenTool as NavIcon },
  { href: "/pre-owned", label: fa.nav.preOwned, icon: Recycle as NavIcon },
  { href: "/stones", label: "دانشنامه سنگ‌ها", icon: Gem as NavIcon },
  { href: "/artisans", label: "استادان", icon: Sparkles as NavIcon },
  { href: "/blog", label: fa.nav.blog, icon: PenTool as NavIcon },
  { href: "/guide/buying", label: fa.nav.buyingGuide, icon: Sparkles as NavIcon },
];

const SECONDARY_NAV_UTILITY = [
  { href: "/faq", label: "سوالی دارید؟" },
  { href: "/ring-size", label: "راهنمای سایز" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function IconBtn({
  href,
  onClick,
  label,
  badge,
  badgeGold,
  active,
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  badge?: number;
  badgeGold?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const base = cn(
    "relative flex h-10 w-10 items-center justify-center rounded-full text-[#78716C] transition-colors hover:bg-[#F5F3EF] hover:text-[#2C2A29]",
    active && "bg-[#F5F3EF] text-[#2C2A29]"
  );

  const pill =
    badge !== undefined && badge > 0 ? (
      <span
        className={cn(
          "absolute -top-1 -end-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none",
          badgeGold ? "bg-gold text-white" : "bg-turquoise text-white"
        )}
      >
        {badge.toLocaleString("fa-IR")}
      </span>
    ) : null;

  if (href) {
    return (
      <Link href={href} className={base} aria-label={label}>
        {children}
        {pill}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base} aria-label={label} aria-pressed={active}>
      {children}
      {pill}
    </button>
  );
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = stripLocalePrefix(pathname).path;
  const { cart, compareList } = useApp();
  const site = useSiteSettings();
  const { banner } = useSiteBanner();
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const hasPromo = isHeaderStripVisible(banner);
  const promoIsImage = hasPromo && banner.headerStripMode === "image";

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("header-promo-active", hasPromo);
    root.classList.toggle("header-promo-active--image", hasPromo && promoIsImage);
    return () => {
      root.classList.remove("header-promo-active");
      root.classList.remove("header-promo-active--image");
    };
  }, [hasPromo, promoIsImage]);

  useEffect(() => {
    if (!searchOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (headerRef.current?.contains(target)) return;
      closeSearch();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [searchOpen, closeSearch]);

  return (
    <header
      ref={headerRef}
      className="header-shell fixed inset-x-0 top-0 z-50 w-full"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn("header-glass", searchOpen && "header-glass--search-open")}
      >
        {hasPromo ? <HeaderPromoStrip banner={banner} /> : null}

        <div className="header-main-row">
          <div className="header-main-row__inner">
            {/* موبایل */}
            <div className="flex w-full items-center justify-between gap-3 lg:hidden">
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <BrandMark size={brandMarkSizes.headerMobile} priority />
                <span className="truncate font-display text-base font-semibold leading-none text-[#2C2A29]">
                  {site.brandName}
                </span>
              </Link>

              <button
                type="button"
                onClick={toggleSearch}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#78716C] transition-colors active:scale-95 hover:bg-[#F5F3EF]",
                  searchOpen && "bg-[#F5F3EF] text-[#2C2A29]"
                )}
                aria-label={fa.nav.search}
                aria-expanded={searchOpen}
              >
                <Search size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
              </button>
            </div>

            {/* دسکتاپ — ردیف اصلی */}
            <div className="hidden lg:flex lg:w-full lg:items-center lg:gap-5">
              <Link href="/" className="header-brand-link group shrink-0">
                <BrandMark size={brandMarkSizes.headerDesktop} priority />
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="block text-base font-semibold leading-tight text-[#2C2A29]">
                    {site.brandName}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-none text-[#78716C]">
                    {site.brandTagline}
                  </span>
                </div>
              </Link>

              <HeaderSearch mode="inline" />

              <div className="header-main-actions">
                <span className="header-main-actions__divider" aria-hidden />

                <IconBtn
                  href="/compare"
                  label={fa.nav.compareItems(compareList.count)}
                  badge={compareList.count}
                >
                  <Compare size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                </IconBtn>

                <IconBtn
                  href="/cart"
                  label={fa.nav.cartItems(cart.count)}
                  badge={cart.count}
                  badgeGold
                >
                  <ShoppingBag size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                </IconBtn>

                <HeaderAccountMenu />
              </div>
            </div>
          </div>
        </div>

        {/* موبایل — جستجوی بازشونده */}
        <div className="lg:hidden">
          <HeaderSearch mode="expand" open={searchOpen} onClose={closeSearch} />
        </div>

        {/* دسکتاپ — ردیف ناوبری */}
        <nav className="header-secondary-nav hidden lg:block" aria-label="منوی اصلی">
          <div className="header-secondary-nav__inner">
            <div className="header-secondary-nav__groups">
              <div className="header-secondary-nav__group">
                <Link
                  href={SECONDARY_NAV_FEATURED.href}
                  className={cn(
                    "header-secondary-nav__link header-secondary-nav__link--featured",
                    isActive(normalizedPath, SECONDARY_NAV_FEATURED.href) &&
                      "header-secondary-nav__link--active"
                  )}
                >
                  <Menu size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
                  <span>{SECONDARY_NAV_FEATURED.label}</span>
                </Link>
                <span className="header-secondary-nav__sep" aria-hidden />
              </div>

              <div className="header-secondary-nav__group">
                {SECONDARY_NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "header-secondary-nav__link",
                        isActive(normalizedPath, link.href) && "header-secondary-nav__link--active"
                      )}
                    >
                      <Icon size={iconSizes.xs} variant={ICON_VARIANT} aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="header-secondary-nav__utility">
              {SECONDARY_NAV_UTILITY.map((link) => (
                <Link key={link.href} href={link.href} className="header-secondary-nav__utility-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </motion.div>
    </header>
  );
}
