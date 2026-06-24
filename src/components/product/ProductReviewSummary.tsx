"use client";

import { useMemo } from "react";
import { useProductComments } from "@/lib/hooks/useComments";
import {
  computeRatingDistribution,
  computeRecommendPercent,
} from "@/lib/product-rating";
import { StarRating } from "@/components/product/StarRating";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

interface ProductReviewSummaryProps {
  productId: string;
  className?: string;
}

const STAR_LEVELS: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

export function ProductReviewSummary({ productId, className }: ProductReviewSummaryProps) {
  const { approved, ratingSummary, isApprovedLoading } = useProductComments(productId);
  const { average, count, displayStars, dimensions } = ratingSummary;

  const distribution = useMemo(() => computeRatingDistribution(approved), [approved]);
  const recommendPercent = useMemo(() => computeRecommendPercent(approved), [approved]);

  const averageFormatted =
    count > 0
      ? average.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : "—";

  if (isApprovedLoading) {
    return (
      <div className={cn("product-review-summary", className)} aria-busy="true">
        <div className="sk h-4 w-24" />
        <div className="sk mt-4 h-8 w-16" />
        <div className="sk mt-3 h-3 w-32" />
        <div className="mt-4 space-y-2">
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
    <div className={cn("product-review-summary", className)}>
      <h3 className="product-review-summary-title">{fa.product.ratingSummaryTitle}</h3>

      <div className="product-review-summary-hero">
        <p className="product-review-summary-score" aria-hidden>
          {averageFormatted}
        </p>
        <div className="product-review-summary-stars">
          <StarRating value={count > 0 ? displayStars : 0} size="md" />
          <p className="product-review-summary-meta">
            {count > 0 ? fa.product.basedOnReviews(count) : fa.product.noReviewsYet}
          </p>
        </div>
      </div>

      {count > 0 && recommendPercent > 0 ? (
        <p className="product-review-summary-recommend">{fa.product.recommendPercent(recommendPercent)}</p>
      ) : null}

      {count > 0 ? (
        <div className="product-review-dimensions" role="list" aria-label={fa.product.ratingDimensionsTitle}>
          {[
            { key: "buildQuality", label: fa.product.ratingDimensionBuildQuality, value: dimensions.buildQuality },
            { key: "beauty", label: fa.product.ratingDimensionBeauty, value: dimensions.beauty },
            { key: "value", label: fa.product.ratingDimensionValue, value: dimensions.value },
            { key: "packaging", label: fa.product.ratingDimensionPackaging, value: dimensions.packaging },
          ].map((item) => (
            <div key={item.key} className="product-review-dimension-item" role="listitem">
              <span className="product-review-dimension-label">{item.label}</span>
              <span className="product-review-dimension-value">
                {item.value.toLocaleString("fa-IR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {count > 0 ? (
        <div
          className="product-review-summary-bars"
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
      ) : null}
    </div>
  );
}
