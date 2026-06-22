"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { getProductStatusConfig } from "@/lib/product-status";
import { getProductDisplayName } from "@/lib/products/product-display-name";
import { formatTomanAmount } from "@/lib/utils";
import { getProductPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface MobileProductBuyBarProps {
  product: Product;
}

const buyBarClassName =
  "pointer-events-none fixed inset-x-0 bottom-[var(--mobile-nav-height-safe)] z-[44] translate-y-[120%] border-t border-[rgba(184,134,11,0.12)] bg-[rgba(255,252,247,0.97)] px-3 py-2 opacity-0 shadow-[0_-10px_28px_-14px_rgba(44,42,41,0.18)] backdrop-blur-[18px] backdrop-saturate-[150%] transition-[transform_260ms_cubic-bezier(0.22,1,0.36,1),opacity_200ms_ease] [-webkit-backdrop-filter:blur(18px)_saturate(150%)] print:hidden lg:hidden";

const buyBarVisibleClassName = "translate-y-0 opacity-100 pointer-events-auto";

const buyBarCtaClassName =
  "h-10 cursor-pointer whitespace-nowrap rounded-full border-0 bg-[linear-gradient(180deg,#c89c2b_0%,#a07514_100%)] px-4 text-xs font-bold text-white transition-[transform,opacity] duration-100 [-webkit-tap-highlight-color:transparent] active:scale-[0.96]";

/**
 * نوار خرید چسبان موبایل — مشابه اپ‌های شاپ:
 *  - فقط در viewportهای کوچک نمایش داده می‌شود (تا lg مخفی است)
 *  - پس از اسکرول ۳۰۰px به بعد ظاهر می‌شود (وقتی دکمهٔ اصلی خرید از دید خارج می‌شود)
 *  - شامل تصویر کوچک، قیمت تخفیف‌خورده و دکمهٔ افزودن به سبد است
 */
export function MobileProductBuyBar({ product }: MobileProductBuyBarProps) {
  const displayName = getProductDisplayName(product);
  const router = useRouter();
  const { cart } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const THRESHOLD = 320;
    let scrolled = false;

    const onScroll = () => {
      const next = window.scrollY > THRESHOLD;
      if (next !== scrolled) {
        scrolled = next;
        setVisible(next);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const status = getProductStatusConfig(product.availability);
  const canBuyByStockRules = isProductPurchasable(
    {
      name: product.namePersian || product.name,
      availability: product.availability,
      stock: product.stock,
    },
    1
  );
  const canAddToCart = status.isImmediate ? canBuyByStockRules : status.canAddToCart;
  const isRemakeRequest = product.availability === "sold";
  const canPrimaryAction = canAddToCart || isRemakeRequest;
  const pricing = getProductPricing(product);

  return (
    <div className={cn(buyBarClassName, visible && buyBarVisibleClassName)} aria-hidden={!visible}>
      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border border-[rgba(184,134,11,0.18)] bg-[rgba(245,243,239,0.6)]">
          <Image src={product.image} alt={displayName} fill sizes="56px" className="object-cover" />
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <p
            className="m-0 truncate text-xs font-semibold leading-[1.2] text-[#2c2a29]"
            title={displayName}
          >
            {displayName}
          </p>
          <p className="m-0 inline-flex items-baseline gap-1 leading-none tabular-nums">
            {pricing.hasProductFurooh ? (
              <span className="text-[10px] text-[#a8a29e] line-through">
                {formatTomanAmount(pricing.listPrice)}
              </span>
            ) : null}
            <span className="text-[13px] font-bold text-[var(--bahakahi-fg)]">
              {formatTomanAmount(pricing.salePrice)}
            </span>
            <span className="text-[9px] text-[#78716c]">تومان</span>
          </p>
        </div>

        <button
          type="button"
          className={cn(
            buyBarCtaClassName,
            !canPrimaryAction && "cursor-not-allowed bg-[#d6d3cf] text-[#78716c] opacity-70"
          )}
          onClick={() => {
            if (isRemakeRequest) {
              router.push(`/customize?source=remake&productId=${encodeURIComponent(product.id)}`);
              return;
            }
            if (canAddToCart) {
              cart.addProduct(product.id);
            }
          }}
          disabled={!canPrimaryAction}
          tabIndex={visible ? 0 : -1}
        >
          {canPrimaryAction ? status.addToCartLabel ?? fa.product.addToCart : fa.commerce.quickAddSoldOut}
        </button>
      </div>
    </div>
  );
}
