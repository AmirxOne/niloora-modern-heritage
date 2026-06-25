"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import {
  formatPieceCode,
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
  className?: string;
}

const pieceNumberBaseClassName = "tabular-nums tracking-[0.04em]";

const pieceNumberValueClassName = "font-body select-all [-webkit-user-select:all]";

const pieceNumberCopyClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(184,134,11,0.25)] bg-[rgba(255,255,255,0.9)] px-[9px] py-1 text-[10px] font-semibold text-[#8b6914] transition-[background-color,transform] duration-100 [-webkit-tap-highlight-color:transparent] hover:bg-[rgba(184,134,11,0.06)] active:scale-[0.96]";

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
  className,
}: PieceNumberProps) {
  const [copied, setCopied] = useState(false);
  const normalized = formatPieceCode(code);

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

  if (variant === "card") {
    return (
      <div
        className={cn(
          pieceNumberBaseClassName,
          "flex flex-col gap-1.5 rounded-xl border border-[rgba(184,134,11,0.22)] bg-[linear-gradient(180deg,rgba(184,134,11,0.06)_0%,rgba(184,134,11,0.02)_100%),rgba(255,252,247,0.85)] px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_16px_-8px_rgba(184,134,11,0.18)]",
          className
        )}
        dir="ltr"
      >
        <div className="flex items-center justify-between gap-2.5">
          <span
            className={cn(
              pieceNumberValueClassName,
              "text-[15px] font-semibold tracking-[0.08em] text-[#2c2a29]"
            )}
            aria-label={fa.product.pieceCode.label}
          >
            {normalized}
          </span>

          {isCopyable ? (
            <button
              type="button"
              onClick={onCopy}
              className={pieceNumberCopyClassName}
              aria-label={fa.product.pieceCode.copyAria}
              title={fa.product.pieceCode.copy}
            >
              {copied ? <Check size={16} variant="Bold" /> : <Copy size={16} variant={ICON_VARIANT} />}
              <span className="whitespace-nowrap max-[480px]:hidden">
                {copied ? fa.product.pieceCode.copied : fa.product.pieceCode.copy}
              </span>
            </button>
          ) : null}
        </div>

        <p className="m-0 text-[10px] leading-[1.45] text-[#78716c]" dir="rtl">
          {fa.product.pieceCode.hint}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          pieceNumberBaseClassName,
          pieceNumberValueClassName,
          "inline-block rounded border border-[rgba(184,134,11,0.12)] bg-[rgba(184,134,11,0.06)] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[#a8a29e]",
          className
        )}
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
      className={cn(
        pieceNumberBaseClassName,
        "inline-flex items-center gap-1.5 text-[11px] text-[#78716c]",
        className
      )}
      dir="rtl"
    >
      <span className="text-[#a8a29e]">{fa.product.pieceCode.labelShort}</span>
      <span
        className={cn(
          pieceNumberValueClassName,
          "font-semibold tracking-[0.05em] text-[#5a5550] [direction:ltr]"
        )}
        dir="ltr"
      >
        {normalized}
      </span>
      {isCopyable ? (
        <button
          type="button"
          onClick={onCopy}
          className="cursor-pointer rounded-md border-0 bg-transparent p-0.5 text-[#a8a29e] [-webkit-tap-highlight-color:transparent] hover:bg-[rgba(184,134,11,0.08)] hover:text-[#8b6914]"
          aria-label={fa.product.pieceCode.copyAria}
          title={fa.product.pieceCode.copy}
        >
          {copied ? <Check size={14} variant="Bold" /> : <Copy size={14} variant={ICON_VARIANT} />}
        </button>
      ) : null}
    </span>
  );
}
