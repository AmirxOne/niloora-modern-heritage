"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { Compare, Menu, Search, ShoppingBag, X } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { stripLocalePrefix } from "@/lib/i18n/locales";

const HeaderSearch = dynamic(
  () => import("@/components/layout/HeaderSearch").then((mod) => mod.HeaderSearch),
  { ssr: false }
);
const HeaderAccountMenu = dynamic(
  () => import("@/components/layout/HeaderAccountMenu").then((mod) => mod.HeaderAccountMenu),
  { ssr: false }
);

const NAV_LINKS = [
  { href: "/",          label: fa.nav.home,      exact: true },
  { href: "/shop",      label: fa.nav.shop },
  { href: "/guide/buying", label: fa.nav.buyingGuide },
  { href: "/customize", label: fa.nav.customize },
  { href: "/blog",      label: fa.nav.blog },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** لوگو الماس */
function DiamondLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8 shrink-0", className)}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <path
        d="M16 3L28 11V21L16 29L4 21V11L16 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 3V29M4 11L28 21M28 11L4 21"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity="0.3"
      />
    </svg>
  );
}

/** دکمه آیکونی با badge */
function IconBtn({
  href,
  onClick,
  label,
  badge,
  badgeGold,
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  badge?: number;
  badgeGold?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-[#78716C] transition-colors hover:bg-[#F5F3EF] hover:text-[#2C2A29]";

  const pill = badge !== undefined && badge > 0 ? (
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
    <button type="button" onClick={onClick} className={base} aria-label={label}>
      {children}
      {pill}
    </button>
  );
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = stripLocalePrefix(pathname).path;
  const { cart, compareList } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen]  = useState(false);

  const openSearch = useCallback(() => {
    setMobileOpen(false);
    setSearchOpen(true);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full">
        {/* ── نوار اصلی ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="header-glass h-[var(--header-height)]"
        >
          <div className="mx-auto flex h-full max-w-[1639px] items-center px-4 md:px-8">

            {/* ━━━ موبایل: هامبورگر | لوگو وسط | جستجو ━━━
                 (سبد و سایر تب‌ها در نوار پایین موبایل قرار دارند) */}
            <div className="flex w-full items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#78716C] transition-colors active:scale-95 hover:bg-[#F5F3EF]"
                aria-label={fa.nav.menu}
                aria-expanded={mobileOpen}
              >
                {mobileOpen
                  ? <X    size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                  : <Menu size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                }
              </button>

              {/* لوگو مرکزی موبایل */}
              <Link href="/" className="flex items-center gap-1.5">
                <DiamondLogo className="h-6 w-6 text-gold" />
                <span className="font-display text-base font-semibold text-[#2C2A29]">
                  {fa.brand.name}
                </span>
              </Link>

              {/* دکمهٔ جستجو موبایل */}
              <button
                type="button"
                onClick={openSearch}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#78716C] transition-colors active:scale-95 hover:bg-[#F5F3EF]"
                aria-label={fa.nav.search}
              >
                <Search size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
              </button>
            </div>

            {/* ━━━ دسکتاپ: لوگو | منو | آیکون‌ها ━━━ */}
            <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:w-full lg:items-center lg:gap-6">

              {/* لوگو — سمت راست (RTL = start) */}
              <Link href="/" className="group flex items-center gap-2.5 justify-self-start">
                <DiamondLogo className="text-gold transition-colors group-hover:text-gold-dark" />
                <div className="min-w-0">
                  <span className="block text-base font-semibold leading-tight text-[#2C2A29]">
                    {fa.brand.name}
                  </span>
                  <span className="block text-[11px] text-[#78716C] leading-none mt-0.5">
                    {fa.brand.tagline}
                  </span>
                </div>
              </Link>

              {/* منوی مرکزی */}
              <nav className="flex items-center gap-7" aria-label="منوی اصلی">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="heritage-nav-link"
                    data-active={isActive(normalizedPath, link.href, link.exact) ? "true" : "false"}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* آیکون‌ها — سمت چپ (RTL = end) */}
              <div className="flex items-center gap-0.5 justify-self-end">
                <LocaleSwitcher />
                <IconBtn onClick={openSearch} label={fa.nav.search}>
                  <Search size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                </IconBtn>

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
        </motion.div>

        {/* ── منوی موبایل ── */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.nav
              key="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="header-glass-solid inset-x-0 top-[var(--header-height)] z-40 overflow-hidden lg:hidden"
              style={{ position: "fixed" }}
            >
              <div className="mx-auto max-w-[1639px] px-4 py-4">
                {/* لینک‌های ناوبری */}
                {NAV_LINKS.map((link, i) => {
                  const active = isActive(normalizedPath, link.href, link.exact);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-[#fdf8ee] text-gold-dark"
                            : "text-[#78716C] hover:bg-[#F5F3EF] hover:text-[#2C2A29]"
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="my-2 h-px bg-[#F0EDE9]" role="separator" />

                {/* جستجو */}
                <button
                  type="button"
                  onClick={openSearch}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#78716C] transition-colors hover:bg-[#F5F3EF] hover:text-[#2C2A29]"
                >
                  <Search size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
                  {fa.nav.search}
                </button>

                {/* حساب */}
                <div className="mt-1">
                  <HeaderAccountMenu />
                </div>
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>

        <HeaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>
      <AnimatePresence>
        {searchOpen ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-stone-900/30"
            aria-label={fa.common.close}
            onClick={() => setSearchOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
