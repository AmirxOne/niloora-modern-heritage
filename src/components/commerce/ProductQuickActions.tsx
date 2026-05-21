"use client";

import Link from "next/link";
import { isProductPurchasable } from "@/lib/products/purchasability";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ProductQuickActionsProps {
  product: Product;
  /** پیش‌فرض false برای صفحهٔ اصلی؛ true برای PDP و نگاه سریع */
  navigateToCart?: boolean;
  exploreLabel?: string;
  className?: string;
  layout?: "stack" | "inline";
  /** استایل دکمهٔ ثانویه روی بنر تیره */
  onDark?: boolean;
}

export function ProductQuickActions({
  product,
  navigateToCart = false,
  exploreLabel = fa.home.bannerExplore,
  className,
  layout = "stack",
  onDark = false,
}: ProductQuickActionsProps) {
  const { cart } = useApp();
  const canBuy = isProductPurchasable(
    {
      name: product.namePersian || product.name,
      availability: product.availability,
      stock: product.stock,
    },
    1
  );

  return (
    <div
      className={cn(
        layout === "stack" ? "flex flex-col gap-3" : "flex flex-wrap gap-2",
        className
      )}
    >
      {canBuy ? (
        <Button
          type="button"
          size="lg"
          className={cn("shadow-luxury-gold", layout === "inline" ? "" : "w-full sm:min-w-[10rem]")}
          onClick={() => cart.addProduct(product.id, { navigateToCart })}
        >
          {fa.commerce.quickAddToCart}
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          variant="secondary"
          disabled
          className={layout === "inline" ? "" : "w-full sm:min-w-[10rem]"}
        >
          {fa.commerce.quickAddSoldOut}
        </Button>
      )}
      <Link href={`/product/${product.id}`} className={layout === "stack" ? "w-full" : ""}>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            layout === "stack" ? "w-full min-w-[10rem]" : "",
            onDark && "border-white/45 text-white hover:bg-white/10"
          )}
        >
          {exploreLabel}
        </Button>
      </Link>
    </div>
  );
}
