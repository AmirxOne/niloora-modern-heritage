"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT } from "@/lib/icons";
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

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const { cart, wishlist } = useApp();

  // در صفحات لاگین/ثبت‌نام نوار پایین نمایش داده نشود.
  if (ROUTE_HIDDEN.has(pathname)) return null;

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
      className="mobile-bottom-nav lg:hidden"
      aria-label="ناوبری اصلی موبایل"
      dir="rtl"
    >
      <ul className="mobile-bottom-nav__list">
        {items.map((item) => {
          // برای تب علاقه‌مندی که با هش هست، فعال‌بودن را با hash بسنجیم.
          const cleanHref = item.href.split("#")[0];
          const isActive = isActiveRoute(pathname, cleanHref, item.exact);
          const Icon = item.icon;
          const hasBadge = (item.badge ?? 0) > 0;

          return (
            <li key={item.href} className="mobile-bottom-nav__item">
              <Link
                href={item.href}
                className={cn(
                  "mobile-bottom-nav__link",
                  isActive && "mobile-bottom-nav__link--active"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <span className="mobile-bottom-nav__icon-wrap" aria-hidden>
                  <Icon size={22} variant={ICON_VARIANT} />
                  {hasBadge ? (
                    <span
                      className={cn(
                        "mobile-bottom-nav__badge",
                        item.badgeGold && "mobile-bottom-nav__badge--gold"
                      )}
                    >
                      {(item.badge ?? 0).toLocaleString("fa-IR")}
                    </span>
                  ) : null}
                </span>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
