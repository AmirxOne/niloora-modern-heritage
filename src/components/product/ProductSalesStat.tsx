"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { selectProductSalesCount } from "@/lib/store/slices/productSalesSlice";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import { BagHappy, Verify } from "@/components/icons";
import { ICON_VARIANT } from "@/lib/icons";

interface ProductSalesStatProps {
  productId: string;
  className?: string;
  /**
   * نمایش پر-جزییات شامل برچسب «خرید موفق» در صورت رسیدن به آستانه.
   * در حالت compact فقط شمارش اصلی نمایش داده می‌شود.
   */
  variant?: "default" | "compact";
}

/**
 * شمارگر فروش حرفه‌ای برای صفحهٔ محصول — به سبک اپ‌های شاپ:
 *  - عدد بزرگ و خوانا (مثلا «۲۴ نفر این اثر را خریده‌اند»)
 *  - برای محصولات با فروش بالا، برچسب «خرید موفق» نمایش داده می‌شود
 *  - برای محصولات با فروش بسیار بالا، شمارش به «بیش از ۱۰۰ بار» گرد می‌شود
 *  - وقتی هنوز فروشی ثبت نشده باشد، چیزی نمایش داده نمی‌شود
 */
export function ProductSalesStat({
  productId,
  className,
  variant = "default",
}: ProductSalesStatProps) {
  const count = useAppSelector(selectProductSalesCount(productId));

  if (count <= 0) return null;

  const t = fa.product.salesStat;
  const isBestseller = count >= 25;
  const displayCount = formatSalesCount(count);
  const sentence = formatSalesSentence(count);

  if (variant === "compact") {
    return (
      <span
        className={cn("product-sales-stat product-sales-stat--compact", className)}
        title={sentence}
      >
        <BagHappy size={14} variant={ICON_VARIANT} aria-hidden />
        <strong className="product-sales-stat__count">{displayCount}</strong>
        <span>{t.compactSuffix}</span>
      </span>
    );
  }

  return (
    <div
      className={cn("product-sales-stat", className)}
      role="group"
      aria-label={sentence}
    >
      <div className="product-sales-stat__icon-wrap" aria-hidden>
        <BagHappy size={22} variant={ICON_VARIANT} />
      </div>

      <div className="product-sales-stat__body">
        <p className="product-sales-stat__title">
          <strong className="product-sales-stat__count">{displayCount}</strong>{" "}
          {t.title}
        </p>
        <p className="product-sales-stat__sub">{t.subtitle}</p>
      </div>

      {isBestseller ? (
        <span
          className="product-sales-stat__chip"
          title={t.bestsellerHint}
          aria-label={t.bestseller}
        >
          <Verify size={14} variant="Bold" aria-hidden />
          {t.bestseller}
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * گرد کردن انسانی شمارش برای نمایش به مشتری:
 *  - زیر ۱۰۰: همان عدد
 *  - بین ۱۰۰ و ۹۹۹: گرد به ۵۰ نزدیک، با پیشوند «+»
 *  - ۱۰۰۰ به بالا: «+1k» مدل
 *
 * این مدل از حس «over-precise» جلوگیری می‌کند که در فروشگاه‌های واقعی هم
 * رایج است (آمازون، دیجی‌کالا، ...).
 */
function formatSalesCount(count: number): string {
  if (count < 100) {
    return count.toLocaleString("fa-IR");
  }
  if (count < 1000) {
    const rounded = Math.floor(count / 50) * 50;
    return `+${rounded.toLocaleString("fa-IR")}`;
  }
  const k = Math.floor(count / 1000);
  return `+${k.toLocaleString("fa-IR")}K`;
}

/** جمله کامل برای aria-label و tooltip */
function formatSalesSentence(count: number): string {
  return fa.product.salesStat.aria(count);
}
