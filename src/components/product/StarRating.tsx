"use client";

import { useState } from "react";
import { RatingStarIcon } from "@/components/product/RatingStarIcon";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  className?: string;
}

const sizeConfig = {
  sm: { star: "h-4 w-4", cell: "h-7 w-7" },
  md: { star: "h-5 w-5", cell: "h-6 w-6" },
} as const;

function starFillFraction(starIndex: number, rating: number) {
  return Math.min(1, Math.max(0, rating - (starIndex - 1)));
}

function formatRatingAria(value: number) {
  return value.toLocaleString("fa-IR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function StarRating({ value, onChange, size = "md", className }: StarRatingProps) {
  const interactive = Boolean(onChange);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;
  const { star: starClass, cell: cellClass } = sizeConfig[size];
  const ariaRating = formatRatingAria(displayValue);

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "group" : "img"}
      aria-label={interactive ? "امتیاز از پنج ستاره" : `امتیاز ${ariaRating} از ۵`}
      onMouseLeave={interactive ? () => setHoverValue(null) : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillFraction = interactive
          ? star <= displayValue
            ? 1
            : 0
          : starFillFraction(star, displayValue);
        const starEl = (
          <RatingStarIcon fillFraction={fillFraction} className={starClass} />
        );
        const cellClassName = cn(
          cellClass,
          "inline-flex shrink-0 items-center justify-center"
        );

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              aria-label={`امتیاز ${star} از ۵`}
              aria-pressed={star <= value}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverValue(star)}
              className={cn(
                cellClassName,
                "rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-95"
              )}
            >
              {starEl}
            </button>
          );
        }

        return (
          <span key={star} className={cellClassName}>
            {starEl}
          </span>
        );
      })}
    </div>
  );
}
