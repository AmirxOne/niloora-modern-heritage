"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT } from "@/lib/icons";
import { stripLocalePrefix } from "@/lib/i18n/locales";
import {
  Heart,
  ShoppingBag,
  Store,
  UserRound,
  Category,
} from "@/components/icons";

type IconComponent = ComponentType<{
  size?: number;
  variant?: typeof ICON_VARIANT;
}>;

interface TabItem {
  href: string;
  label: string;
  icon: IconComponent;
  /** صفحه‌ای که این تب با مسیر دقیق فعال می‌شود */
  exact?: boolean;
  /** نشان عددی روی تب */
  badge?: number;
  /** بج طلایی (سبد) یا فیروزه‌ای (پیش‌فرض) */
  badgeGold?: boolean;
}

const ROUTE_HIDDEN = new Set([
  "/auth",
  "/login",
  "/register",
  "/forgot-password",
]);

function isActiveRoute(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const tabLinkClassName =
  "relative flex min-h-11 w-full flex-col items-center justify-center gap-0.5 text-[#78716c] no-underline transition-colors duration-[180ms] [-webkit-tap-highlight-color:transparent] active:scale-[0.96] active:transition-transform active:duration-100";

const tabLinkActiveClassName =
  "text-[var(--color-accent)] before:absolute before:inset-x-[22%] before:top-0 before:h-0.5 before:rounded-b before:bg-[var(--color-accent)] before:content-['']";

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = stripLocalePrefix(pathname).path;
  const { cart, wishlist } = useApp();

  // در صفحات لاگین/ثبت‌نام نوار پایین نمایش داده نشود.
  if (ROUTE_HIDDEN.has(normalizedPath)) return null;

  const items: TabItem[] = [
    { href: "/", label: fa.nav.home, icon: Category as unknown as IconComponent, exact: true },
    { href: "/shop", label: fa.nav.shop, icon: Store as unknown as IconComponent },
    {
      href: "/account#wishlist",
      label: fa.nav.wishlist,
      icon: Heart as unknown as IconComponent,
      badge: wishlist.ids.length,
    },
    {
      href: "/cart",
      label: fa.nav.cart,
      icon: ShoppingBag as unknown as IconComponent,
      badge: cart.count,
      badgeGold: true,
    },
    {
      href: "/account",
      label: fa.nav.account,
      icon: UserRound as unknown as IconComponent,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-[rgba(184,134,11,0.12)] bg-[rgba(255,252,247,0.92)] pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-[20px] backdrop-saturate-[160%] [-webkit-backdrop-filter:blur(20px)_saturate(160%)] select-none print:hidden lg:hidden"
      aria-label="ناوبری اصلی موبایل"
      dir="rtl"
    >
      <ul className="m-0 grid h-[var(--mobile-nav-height)] list-none grid-cols-5 items-stretch p-0">
        {items.map((item) => {
          // برای تب علاقه‌مندی که با هش هست، فعال‌بودن را با hash بسنجیم.
          const cleanHref = item.href.split("#")[0];
          const isActive = isActiveRoute(normalizedPath, cleanHref, item.exact);
          const Icon = item.icon;
          const hasBadge = (item.badge ?? 0) > 0;

          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                className={cn(tabLinkClassName, isActive && tabLinkActiveClassName)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <span className="relative inline-flex h-7 w-7 items-center justify-center" aria-hidden>
                  <Icon size={22} variant={ICON_VARIANT} />
                  {hasBadge ? (
                    <span
                      className={cn(
                        "absolute -top-1 end-[-6px] inline-flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-[rgba(255,252,247,0.95)] bg-[var(--color-accent)] px-1 text-[9px] font-bold leading-none text-white"
                      )}
                    >
                      {(item.badge ?? 0).toLocaleString("fa-IR")}
                    </span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
