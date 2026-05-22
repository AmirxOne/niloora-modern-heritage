"use client";

import {
  Heart,
  PenTool,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "@/components/icons";
import type { IconComponent } from "@/lib/icons";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";

type AccountStats = {
  orderCount: number;
  totalSpent: number;
  wishlistCount: number;
  savedDesignsCount: number;
  cartItemsCount: number;
};

const tileMeta: {
  id: keyof AccountStats | "spent";
  label: string;
  icon: IconComponent;
  navId?: string;
}[] = [
  { id: "orderCount", label: "تعداد سفارش", icon: ShoppingBag, navId: "orders" },
  { id: "totalSpent", label: "مجموع خرید", icon: Wallet },
  { id: "wishlistCount", label: "علاقه‌مندی", icon: Heart, navId: "wishlist" },
  { id: "savedDesignsCount", label: "طرح ذخیره‌شده", icon: PenTool, navId: "designs" },
  { id: "cartItemsCount", label: "اقلام سبد", icon: ShoppingCart },
];

export function AccountStatTiles({
  stats,
  onTileClick,
}: {
  stats: AccountStats;
  onTileClick?: (section: string) => void;
}) {
  const values: Record<string, string | null> = {
    orderCount: stats.orderCount.toLocaleString("fa-IR"),
    totalSpent: null,
    wishlistCount: stats.wishlistCount.toLocaleString("fa-IR"),
    savedDesignsCount: stats.savedDesignsCount.toLocaleString("fa-IR"),
    cartItemsCount: stats.cartItemsCount.toLocaleString("fa-IR"),
  };

  return (
    <div className="account-stat-grid">
      {tileMeta.map((tile) => {
        const Icon = tile.icon;
        const clickable = Boolean(tile.navId && onTileClick);
        const Tag = clickable ? "button" : "div";

        return (
          <Tag
            key={tile.id}
            type={clickable ? "button" : undefined}
            className={cn("account-stat-tile", clickable && "account-stat-tile--clickable")}
            onClick={clickable ? () => onTileClick!(tile.navId!) : undefined}
          >
            <span className="account-stat-tile-icon" aria-hidden>
              <Icon size={iconSizes.sm} variant={ICON_VARIANT} />
            </span>
            <p className="account-stat-tile-label">{tile.label}</p>
            <p className={cn("account-stat-tile-value", tile.id === "totalSpent" && "text-price-sale")}>
              {tile.id === "totalSpent" ? (
                <TomanPrice amount={stats.totalSpent} size="xs" />
              ) : (
                values[tile.id]
              )}
            </p>
          </Tag>
        );
      })}
    </div>
  );
}
