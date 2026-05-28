"use client";

import {
  Hammer,
  LayoutDashboard,
  MessageSquare,
  ScanEye,
  ShoppingBag,
  Heart,
  Compare,
  History,
  PenTool,
  Recycle,
  Sparkles,
  User,
  UserRound,
  ShoppingCart,
  Store,
  Receipt,
  Wallet,
} from "@/components/icons";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type AccountNavItem = {
  id: string;
  label: string;
  badge?: number;
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
  ugc: <ScanEye size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  wishlist: <Heart size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  compare: <Compare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "recently-viewed": <History size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  designs: <PenTool size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-moderation": <MessageSquare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-orders": <ShoppingCart size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-products": <Store size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-trade-in": <Recycle size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-promo-codes": <Sparkles size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-home": <LayoutDashboard size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-posts": <PenTool size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-gift-cards": <Wallet size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
  "admin-customizer-quotes": <Hammer size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
};

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
