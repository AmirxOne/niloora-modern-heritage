import { useId } from "react";
import { cn } from "@/lib/utils";

/** مسیر ستاره پنج‌پر — پرهای کمی کوتاه‌تر برای ظاهر نرم‌تر */
const STAR_PATH =
  "M12 3.15l2.65 5.36 5.9.86-4.28 4.17 1.01 5.88L12 16.75l-5.28 2.77 1.01-5.88-4.28-4.17 5.9-.86L12 3.15z";

const STAR_STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

interface RatingStarIconProps {
  filled?: boolean;
  /** 0–1 for partial fill; overrides `filled` when set */
  fillFraction?: number;
  className?: string;
}

function clampFraction(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function RatingStarIcon({
  filled = false,
  fillFraction,
  className,
}: RatingStarIconProps) {
  const fraction =
    fillFraction != null ? clampFraction(fillFraction) : filled ? 1 : 0;
  const clipId = `rating-star-clip-${useId().replace(/:/g, "")}`;

  if (fraction >= 1) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0 text-gold", className)}>
        <path d={STAR_PATH} fill="currentColor" {...STAR_STROKE} />
      </svg>
    );
  }

  if (fraction <= 0) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0 text-gold/40", className)}>
        <path
          d={STAR_PATH}
          fill="currentColor"
          fillOpacity={0.12}
          {...STAR_STROKE}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <clipPath id={clipId}>
          <rect x={24 * (1 - fraction)} y="0" width={24 * fraction} height="24" />
        </clipPath>
      </defs>
      <path
        d={STAR_PATH}
        fill="currentColor"
        fillOpacity={0.12}
        className="text-gold/40"
        {...STAR_STROKE}
      />
      <path
        d={STAR_PATH}
        fill="currentColor"
        className="text-gold"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
