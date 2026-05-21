"use client";

import Link from "next/link";
import { ChevronLeft, ShoppingBag, Heart, PenTool, Sparkles } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AccountStatTiles } from "@/components/account/AccountStatTiles";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";

type AccountStats = {
  orderCount: number;
  totalSpent: number;
  wishlistCount: number;
  savedDesignsCount: number;
  cartItemsCount: number;
};

export function AccountOverviewPanel({
  stats,
  onNavigate,
}: {
  stats: AccountStats;
  onNavigate: (section: string) => void;
}) {
  const shortcuts = [
    {
      id: "orders",
      label: fa.dashboard.purchaseHistory,
      hint: fa.dashboard.ordersCount(stats.orderCount),
      icon: ShoppingBag,
    },
    {
      id: "wishlist",
      label: fa.dashboard.wishlist,
      hint: `${stats.wishlistCount.toLocaleString("fa-IR")} مورد`,
      icon: Heart,
    },
    {
      id: "designs",
      label: fa.dashboard.savedDesigns,
      hint: `${stats.savedDesignsCount.toLocaleString("fa-IR")} طرح`,
      icon: PenTool,
    },
  ];

  return (
    <div className="account-overview space-y-6">
      <div className="account-highlight-card">
        <div className="account-highlight-content">
          <span className="account-highlight-icon" aria-hidden>
            <Sparkles size={iconSizes.md} variant={ICON_VARIANT} />
          </span>
          <div>
            <p className="account-highlight-eyebrow">وضعیت حساب</p>
            <p className="account-highlight-value">{formatPrice(stats.totalSpent)}</p>
            <p className="account-highlight-hint">مجموع خریدهای ثبت‌شده در گالری</p>
          </div>
        </div>
        <Link href="/shop">
          <Button variant="outline" size="sm">
            {fa.dashboard.browseCollection}
          </Button>
        </Link>
      </div>

      <AccountStatTiles stats={stats} onTileClick={onNavigate} />

      <div>
        <h3 className="account-subsection-title">دسترسی سریع</h3>
        <ul className="account-shortcuts">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button type="button" className="account-shortcut" onClick={() => onNavigate(item.id)}>
                  <span className="account-shortcut-icon" aria-hidden>
                    <Icon size={iconSizes.sm} variant={ICON_VARIANT} />
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="account-shortcut-label">{item.label}</span>
                    <span className="account-shortcut-hint">{item.hint}</span>
                  </span>
                  <ChevronLeft className="account-shortcut-chevron" size={iconSizes.sm} variant={ICON_VARIANT} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
