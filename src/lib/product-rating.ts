export interface ProductRatingSummary {
  average: number;
  count: number;
  /** امتیاز گردشده ۱–۵ برای نمایش ستاره */
  displayStars: number;
  dimensions: {
    buildQuality: number;
    beauty: number;
    value: number;
    packaging: number;
  };
}

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export function computeProductRating(
  ratings: readonly {
    rating: number;
    ratingBuildQuality?: number;
    ratingBeauty?: number;
    ratingValue?: number;
    ratingPackaging?: number;
  }[]
): ProductRatingSummary {
  if (ratings.length === 0) {
    return {
      average: 0,
      count: 0,
      displayStars: 0,
      dimensions: {
        buildQuality: 0,
        beauty: 0,
        value: 0,
        packaging: 0,
      },
    };
  }

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const buildQualitySum = ratings.reduce((acc, r) => acc + (r.ratingBuildQuality ?? r.rating), 0);
  const beautySum = ratings.reduce((acc, r) => acc + (r.ratingBeauty ?? r.rating), 0);
  const valueSum = ratings.reduce((acc, r) => acc + (r.ratingValue ?? r.rating), 0);
  const packagingSum = ratings.reduce((acc, r) => acc + (r.ratingPackaging ?? r.rating), 0);
  const average = sum / ratings.length;
  const displayStars = Math.min(5, Math.max(1, Math.round(average)));

  return {
    average,
    count: ratings.length,
    displayStars,
    dimensions: {
      buildQuality: buildQualitySum / ratings.length,
      beauty: beautySum / ratings.length,
      value: valueSum / ratings.length,
      packaging: packagingSum / ratings.length,
    },
  };
}

export function computeRatingDistribution(
  ratings: readonly { rating: number }[]
): RatingDistribution {
  const dist: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const { rating } of ratings) {
    const star = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
    dist[star] += 1;
  }
  return dist;
}

/** درصد نظراتی با امتیاز ۴ یا ۵ */
export function computeRecommendPercent(ratings: readonly { rating: number }[]): number {
  if (ratings.length === 0) return 0;
  const positive = ratings.filter((r) => r.rating >= 4).length;
  return Math.round((positive / ratings.length) * 100);
}
