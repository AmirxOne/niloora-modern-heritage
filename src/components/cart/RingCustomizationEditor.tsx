"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Trash2 } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface RingCustomizationEditorProps {
  item: CartItem;
  onClear: () => void;
  className?: string;
}

export function RingCustomizationEditor({ item, onClear, className }: RingCustomizationEditorProps) {
  if (!item.productId || item.customizerState) return null;
  const href = `/customize?productId=${encodeURIComponent(item.productId)}`;
  const hasCustomization = Boolean(item.ringPurchaseCustomization);
  const currentDelta = item.ringPurchaseCustomization?.totalCustomizationDelta ?? 0;

  return (
    <div
      className={cn(
        "mt-3 rounded-heritage border border-gold/15 bg-gradient-to-br from-parchment/35 to-parchment/15 p-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <p className="text-xs font-semibold text-ivory">شخصی‌سازی انگشتر</p>
          <p className="text-[11px] text-silver">
            {hasCustomization ? "تنظیمات ذخیره‌شده قابل ویرایش است." : "رکاب و حکاکی را مطابق سلیقه خود تنظیم کنید."}
          </p>
        </div>
        {hasCustomization ? (
          <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold-dark">
            دلتا: {currentDelta.toLocaleString("fa-IR")} تومان
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Link href={href}>
          <Button size="sm" variant="outline">
            {hasCustomization ? "ویرایش شخصی‌سازی خرید" : "شخصی‌سازی خرید"}
          </Button>
        </Link>
        {hasCustomization ? (
          <Button size="sm" variant="ghost" onClick={onClear}>
            <Trash2 size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            حذف شخصی‌سازی
          </Button>
        ) : null}
      </div>
    </div>
  );
}

