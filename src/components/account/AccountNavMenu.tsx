"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Compare,
  History,
  PenTool,
  MessageSquare,
  UserRound,
  ShoppingCart,
  Store,
  Receipt,
} from "@/components/icons";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type AccountNavItem = {
  id: string;
  label: string;
  badge?: number;
};

const iconById: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  profile: <UserRound size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  orders: <ShoppingBag size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  wishlist: <Heart size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  compare: <Compare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "recently-viewed": <History size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  designs: <PenTool size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  moderation: <MessageSquare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-orders": <ShoppingCart size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-products": <Store size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  quotes: <Receipt size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
};

export function AccountNavMenu({
  items,
  activeId,
  onChange,
}: {
  items: AccountNavItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="account-nav" aria-label="منوی حساب کاربری">
      <p className="account-nav-label">بخش‌ها</p>
      <ul className="account-nav-list">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn("account-nav-item", isActive && "account-nav-item--active")}
              >
                <span className="account-nav-item-icon">{iconById[item.id] ?? null}</span>
                <span className="flex-1 text-start">{item.label}</span>
                {item.badge != null && item.badge > 0 ? (
                  <span className="account-nav-badge">{item.badge.toLocaleString("fa-IR")}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
