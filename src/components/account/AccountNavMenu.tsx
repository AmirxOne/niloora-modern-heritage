"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Compare,
  History,
  PenTool,
  User,
  UserRound,
  Receipt,
} from "@/components/icons";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type AccountNavItem = {
  id: string;
  label: string;
  badge?: number;
  href?: string;
};

export type AccountNavGroup = {
  label: string;
  items: AccountNavItem[];
};

const iconById: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  profile: <UserRound size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  referrals: <User size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  orders: <ShoppingBag size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  quotes: <Receipt size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  wishlist: <Heart size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  compare: <Compare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "recently-viewed": <History size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  designs: <PenTool size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
};

function navItemIcon(id: string): React.ReactNode {
  return iconById[id] ?? null;
}

function AccountNavList({
  items,
  activeId,
  onChange,
}: {
  items: AccountNavItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <ul className="account-nav-list">
      {items.map((item) => {
        const isActive = !item.href && activeId === item.id;
        const className = cn("account-nav-item", isActive && "account-nav-item--active");
        const content = (
          <>
            <span className="account-nav-item-icon">{navItemIcon(item.id)}</span>
            <span className="flex-1 text-start">{item.label}</span>
            {item.badge != null && item.badge > 0 ? (
              <span className="account-nav-badge">{item.badge.toLocaleString("fa-IR")}</span>
            ) : null}
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={className}>
                {content}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={className}
              >
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AccountNavMenu({
  groups,
  activeId,
  onChange,
}: {
  groups: AccountNavGroup[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="account-nav" aria-label="منوی حساب کاربری">
      {groups.map((group, index) => (
        <div
          key={group.label}
          className={cn("account-nav-group", index > 0 && "account-nav-group--bordered")}
        >
          <p className="account-nav-label">{group.label}</p>
          <AccountNavList items={group.items} activeId={activeId} onChange={onChange} />
        </div>
      ))}
    </nav>
  );
}
