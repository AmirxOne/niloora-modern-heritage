"use client";

import { useMemo } from "react";
import { useProductComments } from "@/lib/hooks/useComments";
import {
  computeRatingDistribution,
  computeRecommendPercent,
  type ProductRatingSummary,
} from "@/lib/product-rating";
import type { ProductComment } from "@/lib/types";
import { StarRating } from "@/components/product/StarRating";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

interface ProductReviewSummaryProps {
  productId: string;
  className?: string;
}

interface ReviewSummarySharedProps {
  productId: string;
  className?: string;
  approved?: ProductComment[];
  ratingSummary?: ProductRatingSummary;
  isApprovedLoading?: boolean;
  /** خلاصهٔ چسبان سایدبار */
  compact?: boolean;
}

const STAR_LEVELS: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

function useReviewSummaryData({
  productId,
  approved: approvedProp,
  ratingSummary: ratingSummaryProp,
  isApprovedLoading: isApprovedLoadingProp,
}: ReviewSummarySharedProps) {
  const hookData = useProductComments(productId);
  return {
    approved: approvedProp ?? hookData.approved,
    ratingSummary: ratingSummaryProp ?? hookData.ratingSummary,
    isApprovedLoading: isApprovedLoadingProp ?? hookData.isApprovedLoading,
  };
}

export function ProductReviewScoreBlock({
  productId,
  className,
  ratingSummary: ratingSummaryProp,
  isApprovedLoading: isApprovedLoadingProp,
  compact = false,
}: ReviewSummarySharedProps) {
  const { ratingSummary, isApprovedLoading } = useReviewSummaryData({
    productId,
    ratingSummary: ratingSummaryProp,
    isApprovedLoading: isApprovedLoadingProp,
  });
  const { average, count } = ratingSummary;

  const averageFormatted =
    count > 0
      ? average.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : (0).toLocaleString("fa-IR");

  if (isApprovedLoading) {
    return (
      <div className={cn("product-reviews-score-block", className)} aria-busy="true">
        <div className="sk h-10 w-16" />
        <div className="sk mt-2 h-4 w-24" />
        {compact ? <div className="sk mt-2 h-5 w-28" /> : null}
        <div className="sk mt-2 h-3 w-32" />
      </div>
    );
  }

  return (
    <div className={cn("product-reviews-score-block", compact && "product-reviews-score-block--compact", className)}>
      <div className="product-reviews-score-row">
        <p className="product-reviews-score-value" aria-hidden>
          {averageFormatted}
        </p>
        <span className="product-reviews-score-suffix">{fa.product.scoreOutOfFive}</span>
      </div>
      {!compact ? (
        <StarRating value={count > 0 ? average : 0} size="md" className="product-reviews-score-stars" />
      ) : null}
      <p className="product-reviews-score-meta">{fa.product.fromTotalRatings(count)}</p>
      {compact && count > 0 ? (
        <div
          className="product-reviews-score-stars-row"
          aria-label={fa.product.ratingAria(average, count)}
        >
          <StarRating value={average} size="md" />
        </div>
      ) : null}
    </div>
  );
}

export function ProductReviewDistributionBars({
  productId,
  className,
  approved: approvedProp,
  ratingSummary: ratingSummaryProp,
  isApprovedLoading: isApprovedLoadingProp,
}: ReviewSummarySharedProps) {
  const { approved, ratingSummary, isApprovedLoading } = useReviewSummaryData({
    productId,
    approved: approvedProp,
    ratingSummary: ratingSummaryProp,
    isApprovedLoading: isApprovedLoadingProp,
  });
  const { count } = ratingSummary;
  const distribution = useMemo(() => computeRatingDistribution(approved), [approved]);

  if (isApprovedLoading) {
    return (
      <div className={cn("product-reviews-bars-block", className)} aria-busy="true">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="sk h-3 w-12" />
              <div className="sk h-2 flex-1" />
              <div className="sk h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("product-reviews-bars-block", className)}
      role="group"
      aria-label={fa.product.ratingDistributionAria}
    >
      {STAR_LEVELS.map((star) => {
        const starCount = distribution[star];
        const percent = count > 0 ? Math.round((starCount / count) * 100) : 0;
        return (
          <div key={star} className="product-review-summary-bar-row">
            <span className="product-review-summary-bar-label">{fa.product.starsRowLabel(star)}</span>
            <div className="product-review-summary-bar-track">
              <div
                className="product-review-summary-bar-fill"
                style={{ width: `${percent}%` }}
                role="presentation"
              />
            </div>
            <span className="product-review-summary-bar-count">
              {starCount.toLocaleString("fa-IR")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ProductReviewSummary({ productId, className }: ProductReviewSummaryProps) {
  const { approved, ratingSummary, isApprovedLoading } = useProductComments(productId);
  const { count } = ratingSummary;
  const recommendPercent = useMemo(() => computeRecommendPercent(approved), [approved]);

  if (isApprovedLoading) {
    return (
      <div className={cn("product-review-summary", className)} aria-busy="true">
        <div className="sk h-4 w-24" />
        <div className="sk mt-4 h-8 w-16" />
        <div className="sk mt-3 h-3 w-32" />
      </div>
    );
  }

  return (
    <div className={cn("product-review-summary", className)}>
      <h3 className="product-review-summary-title">{fa.product.ratingSummaryTitle}</h3>
      <ProductReviewScoreBlock
        productId={productId}
        approved={approved}
        ratingSummary={ratingSummary}
        isApprovedLoading={isApprovedLoading}
      />
      {count > 0 && recommendPercent > 0 ? (
        <p className="product-review-summary-recommend">{fa.product.recommendPercent(recommendPercent)}</p>
      ) : null}
      <ProductReviewDistributionBars
        productId={productId}
        approved={approved}
        ratingSummary={ratingSummary}
        isApprovedLoading={isApprovedLoading}
      />
    </div>
  );
}
