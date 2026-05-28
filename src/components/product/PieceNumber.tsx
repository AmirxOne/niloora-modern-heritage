"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import {
  formatPieceCode,
  parsePieceCode,
  PRODUCT_TYPE_CODES,
} from "@/lib/products/piece-code";
import { Check, Copy } from "@/components/icons";
import { ICON_VARIANT } from "@/lib/icons";

type PieceNumberVariant = "compact" | "inline" | "card";

export interface PieceNumberProps {
  /** کد خام (مثل «NL-RGM-0042») — به‌صورت داخلی نرمال‌سازی می‌شود */
  code: string;
  /** اندازه و سبک نمایش */
  variant?: PieceNumberVariant;
  /** نمایش دکمهٔ کپی (در variantهای compact به‌طور پیش‌فرض فعال) */
  copyable?: boolean;
  /** نمایش برچسب نوع اثر (انگشتر مردانه / گردنبند …) */
  showTypeLabel?: boolean;
  className?: string;
}

/**
 * نمایش «شمارهٔ اثر» با امکان کپی روی موبایل و دسکتاپ.
 *
 *   variant="card"    → بزرگ، با هاله طلایی، مناسب صفحهٔ محصول
 *   variant="inline"  → یک‌خطی، بدون کادر، مناسب کارت و فاکتور
 *   variant="compact" → خیلی کوچک، فقط کد (با کپی اختیاری)
 */
export function PieceNumber({
  code,
  variant = "inline",
  copyable,
  showTypeLabel = false,
  className,
}: PieceNumberProps) {
  const [copied, setCopied] = useState(false);
  const normalized = formatPieceCode(code);
  const parsed = parsePieceCode(normalized);

  const isCopyable = copyable ?? variant !== "compact";

  const onCopy = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !navigator.clipboard) {
        const ta = document.createElement("textarea");
        ta.value = normalized;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } else {
        await navigator.clipboard.writeText(normalized);
      }
      setCopied(true);
      toast.success(fa.product.pieceCode.copied);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // در نسخه‌های قدیمی بدون clipboard API — ساکت می‌مانیم
    }
  }, [normalized]);

  const typeLabel =
    parsed?.productType !== undefined && parsed.productType !== null
      ? PRODUCT_TYPE_CODES[parsed.productType].faLabel
      : null;

  if (variant === "card") {
    return (
      <div
        className={cn("piece-number piece-number--card", className)}
        dir="ltr"
      >
        <div className="piece-number__head" dir="rtl">
          <span className="piece-number__label">{fa.product.pieceCode.label}</span>
          {showTypeLabel && typeLabel ? (
            <span className="piece-number__type">{typeLabel}</span>
          ) : null}
        </div>

        <div className="piece-number__row">
          <span className="piece-number__value" aria-label={fa.product.pieceCode.label}>
            {normalized}
          </span>

          {isCopyable ? (
            <button
              type="button"
              onClick={onCopy}
              className="piece-number__copy"
              aria-label={fa.product.pieceCode.copyAria}
              title={fa.product.pieceCode.copy}
            >
              {copied ? <Check size={16} variant="Bold" /> : <Copy size={16} variant={ICON_VARIANT} />}
              <span className="piece-number__copy-label">
                {copied ? fa.product.pieceCode.copied : fa.product.pieceCode.copy}
              </span>
            </button>
          ) : null}
        </div>

        <p className="piece-number__hint" dir="rtl">
          {fa.product.pieceCode.hint}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn("piece-number piece-number--compact", className)}
        dir="ltr"
        title={`${fa.product.pieceCode.label}: ${normalized}`}
      >
        {normalized}
      </span>
    );
  }

  // variant === "inline"
  return (
    <span
      className={cn("piece-number piece-number--inline", className)}
      dir="rtl"
    >
      <span className="piece-number__inline-label">
        {fa.product.pieceCode.labelShort}
      </span>
      <span className="piece-number__value" dir="ltr">
        {normalized}
      </span>
      {isCopyable ? (
        <button
          type="button"
          onClick={onCopy}
          className="piece-number__copy piece-number__copy--inline"
          aria-label={fa.product.pieceCode.copyAria}
          title={fa.product.pieceCode.copy}
        >
          {copied ? <Check size={14} variant="Bold" /> : <Copy size={14} variant={ICON_VARIANT} />}
        </button>
      ) : null}
    </span>
  );
}

