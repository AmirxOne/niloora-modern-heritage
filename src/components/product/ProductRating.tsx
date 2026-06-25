"use client";

import { useProductComments } from "@/lib/hooks/useComments";
import { StarRating } from "@/components/product/StarRating";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import type { ProductComment } from "@/lib/types";

interface ProductRatingProps {
  productId: string;
  size?: "sm" | "md";
  showCount?: boolean;
  showAverage?: boolean;
  className?: string;
  initialApproved?: ProductComment[];
}

function ProductRatingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("product-rating", className)} aria-busy="true" aria-hidden>
      <div className="sk h-4 w-[4.5rem] rounded-sm" />
      <div className="sk h-4 w-7 rounded-sm" />
      <div className="sk h-3 w-16 rounded-sm" />
    </div>
  );
}

export function ProductRating({
  productId,
  size = "sm",
  showCount = true,
  showAverage = true,
  className,
  initialApproved,
}: ProductRatingProps) {
  const { ratingSummary, isApprovedLoading } = useProductComments(productId, initialApproved);
  const { average, count } = ratingSummary;

  if (isApprovedLoading) {
    return <ProductRatingSkeleton className={className} />;
  }

  if (count === 0) return null;

  const averageFormatted = average.toLocaleString("fa-IR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div
      className={cn("product-rating", className)}
      aria-label={fa.product.ratingAria(average, count)}
    >
      <StarRating value={average} size={size} />
      {showAverage ? (
        <span className="product-rating-average">{averageFormatted}</span>
      ) : null}
      {showCount ? (
        <span className="product-rating-count">{fa.product.ratingReviews(count)}</span>
      ) : null}
    </div>
  );
}
