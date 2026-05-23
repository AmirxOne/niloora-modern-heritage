"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { getProductStatusConfig } from "@/lib/product-status";
import { formatTomanAmount } from "@/lib/utils";
import { getProductPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface MobileProductBuyBarProps {
  product: Product;
}

/**
 * نوار خرید چسبان موبایل — مشابه اپ‌های شاپ:
 *  - فقط در viewportهای کوچک نمایش داده می‌شود (تا lg مخفی است)
 *  - پس از اسکرول ۳۰۰px به بعد ظاهر می‌شود (وقتی دکمهٔ اصلی خرید از دید خارج می‌شود)
 *  - شامل تصویر کوچک، قیمت تخفیف‌خورده و دکمهٔ افزودن به سبد است
 */
export function MobileProductBuyBar({ product }: MobileProductBuyBarProps) {
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
    <div
      className={cn(
        "mobile-product-buy-bar lg:hidden",
        visible && "mobile-product-buy-bar--visible"
      )}
      aria-hidden={!visible}
    >
      <div className="mobile-product-buy-bar__inner">
        <div className="mobile-product-buy-bar__media">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>

        <div className="mobile-product-buy-bar__info">
          <p className="mobile-product-buy-bar__name" title={product.name}>
            {product.name}
          </p>
          <p className="mobile-product-buy-bar__price">
            {pricing.hasProductFurooh ? (
              <span className="mobile-product-buy-bar__price-old">
                {formatTomanAmount(pricing.listPrice)}
              </span>
            ) : null}
            <span className="mobile-product-buy-bar__price-current">
              {formatTomanAmount(pricing.salePrice)}
            </span>
            <span className="mobile-product-buy-bar__price-currency">تومان</span>
          </p>
        </div>

        <button
          type="button"
          className={cn(
            "mobile-product-buy-bar__cta",
            !canPrimaryAction && "mobile-product-buy-bar__cta--disabled"
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
