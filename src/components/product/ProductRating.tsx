"use client";

import { useProductComments } from "@/lib/hooks/useComments";
import { StarRating } from "@/components/product/StarRating";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

interface ProductRatingProps {
  productId: string;
  size?: "sm" | "md";
  showCount?: boolean;
  showAverage?: boolean;
  className?: string;
}

export function ProductRating({
  productId,
  size = "sm",
  showCount = true,
  showAverage = true,
  className,
}: ProductRatingProps) {
  const { ratingSummary } = useProductComments(productId);
  const { average, count, displayStars } = ratingSummary;

  if (count === 0) return null;

  const averageFormatted = average.toLocaleString("fa-IR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div
      className={cn("product-rating", className)}
      aria-label={fa.product.ratingAria(displayStars, count)}
    >
      <StarRating value={displayStars} size={size} />
      {showAverage ? (
        <span className="product-rating-average">{averageFormatted}</span>
      ) : null}
      {showCount ? (
        <span className="product-rating-count">{fa.product.ratingReviews(count)}</span>
      ) : null}
    </div>
  );
}
