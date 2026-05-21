"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Gem,
  LayoutDashboard,
  LogOut,
  PenTool,
  ShoppingCart,
  Recycle,
  ShoppingBag,
  Sparkles,
  Store,
  User,
} from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export function HeaderAccountMenu() {
  const pathname = usePathname();
  const { auth, cart } = useApp();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  if (!auth.sessionResolved) {
    return (
      <span
        aria-hidden
        className="header-auth-btn header-auth-btn--primary pointer-events-none opacity-0"
      >
        <User size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
        <span className="hidden sm:inline">{fa.nav.loginOrRegister}</span>
      </span>
    );
  }

  if (!auth.isLoggedIn) {
    return (
      <Link
        href="/auth"
        className="header-auth-btn header-auth-btn--primary"
        aria-label={fa.nav.loginOrRegister}
      >
        <User size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
        <span className="hidden sm:inline">{fa.nav.loginOrRegister}</span>
      </Link>
    );
  }

  const adminItems: MenuItem[] =
    auth.user?.role === "admin"
      ? [
          {
            href: "/admin/orders",
            label: fa.admin.orders.navLabel,
            icon: <ShoppingCart size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
          {
            href: "/admin/products",
            label: fa.admin.products.navLabel,
            icon: <Store size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
          {
            href: "/admin/trade-in",
            label: fa.admin.tradeIn.navLabel,
            icon: <Recycle size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
          {
            href: "/admin/support-requests",
            label: fa.admin.supportRequests.navLabel,
            icon: <PenTool size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
          {
            href: "/admin/promo-codes",
            label: fa.admin.promoCodes.navLabel,
            icon: <Sparkles size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
          {
            href: "/admin/home",
            label: fa.admin.home.navLabel,
            icon: <LayoutDashboard size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
          {
            href: "/admin/posts",
            label: fa.admin.posts.navLabel,
            icon: <PenTool size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          },
        ]
      : [];

  const menuSections: MenuSection[] = [
    {
      title: fa.nav.accountGroupProfile,
      items: [
        {
          href: "/account",
          label: fa.nav.myAccount,
          icon: <User size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        },
      ],
    },
    {
      title: fa.nav.accountGroupShopping,
      items: [
        {
          href: "/cart",
          label: fa.nav.myCart,
          icon: <ShoppingBag size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
          badge: cart.count,
        },
      ],
    },
    {
      title: fa.nav.accountGroupGallery,
      items: [
        {
          href: "/shop",
          label: fa.nav.shop,
          icon: <Store size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        },
        {
          href: "/pre-owned",
          label: fa.nav.preOwned,
          icon: <Gem size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        },
        {
          href: "/pre-owned/sell",
          label: fa.nav.accountSellPreOwned,
          icon: <Recycle size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        },
      ],
    },
    {
      title: fa.nav.accountGroupAtelier,
      items: [
        {
          href: "/customize",
          label: fa.nav.customize,
          icon: <Sparkles size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        },
      ],
    },
    ...(adminItems.length > 0
      ? [
          {
            title: fa.admin.eyebrow,
            items: adminItems,
          },
        ]
      : []),
  ];

  return (
    <div ref={rootRef} className="header-account-menu">
      <button
        type="button"
        className={cn("header-account-menu-trigger", open && "header-account-menu-trigger--open")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={open ? fa.nav.accountMenuClose : fa.nav.accountMenuOpen}
      >
        <User size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
        <span className="header-account-menu-label hidden sm:inline">{fa.nav.myAccount}</span>
        <ChevronDown
          size={iconSizes.sm}
          variant={ICON_VARIANT}
          className={cn("header-account-menu-chevron", open && "header-account-menu-chevron--open")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="header-account-menu-panel"
          aria-label={fa.nav.accountSection}
        >
          {auth.user ? (
            <Link href="/account" className="header-account-menu-user" onClick={close}>
              <span className="header-account-menu-avatar" aria-hidden>
                {auth.user.name?.charAt(0) ?? "؟"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="header-account-menu-user-name">{auth.user.name}</p>
                <p className="header-account-menu-user-email" dir="ltr">
                  {auth.user.phone}
                </p>
              </div>
            </Link>
          ) : null}

          <div className="header-account-menu-scroll">
            {menuSections.map((section) => (
              <div key={section.title} className="header-account-menu-group">
                <p className="header-account-menu-section-title">{section.title}</p>
                <ul className="header-account-menu-list">
                  {section.items.map((item) => (
                    <li key={`${section.title}-${item.href}-${item.label}`} role="none">
                      <Link
                        href={item.href}
                        role="menuitem"
                        className="header-account-menu-item"
                        onClick={close}
                      >
                        <span className="header-account-menu-item-icon">{item.icon}</span>
                        <span className="header-account-menu-item-label">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 ? (
                          <span className="header-account-menu-badge">
                            {item.badge.toLocaleString("fa-IR")}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="header-account-menu-footer">
            <button
              type="button"
              role="menuitem"
              className="header-account-menu-item header-account-menu-item--danger w-full"
              onClick={() => {
                auth.logout();
                close();
              }}
            >
              <span className="header-account-menu-item-icon">
                <LogOut size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
              </span>
              <span className="header-account-menu-item-label">{fa.nav.logout}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
