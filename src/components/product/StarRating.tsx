"use client";

import { Star } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ICON_VARIANT } from "@/lib/icons";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({ value, onChange, size = "md", className }: StarRatingProps) {
  const interactive = Boolean(onChange);
  const pixelSize = size === "sm" ? 14 : 20;
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "group" : "img"}
      aria-label={interactive ? "امتیاز از پنج ستاره" : `امتیاز ${value} از ۵`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const starEl = (
          <Star
            className={cn("h-full w-full", filled ? "fill-gold text-gold" : "fill-transparent text-gold/35")}
            fill={filled ? "currentColor" : "none"}
            size={pixelSize}
            variant={ICON_VARIANT}
            aria-hidden
          />
        );

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              aria-label={`امتیاز ${star} از ۵`}
              aria-pressed={star <= value}
              onClick={() => onChange?.(star)}
              className={cn(
                sizeClass,
                "rounded-sm transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              )}
            >
              {starEl}
            </button>
          );
        }
        return (
          <span key={star} className={sizeClass}>
            {starEl}
          </span>
        );
      })}
    </div>
  );
}
