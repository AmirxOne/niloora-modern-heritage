export { dynamic } from "@/lib/server/route-segment";

import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getHomeBannerSettings } from "@/lib/server/home/home-banner";
import { resolveHomeSliderProducts } from "@/lib/server/home/home-slider";
import { listHomeInstagramPosts } from "@/lib/server/home/home-instagram";
import { listHomeTestimonials } from "@/lib/server/home/home-testimonials";
import { readSessionUser } from "@/lib/server/auth/session";
import { listActivePublicCampaigns } from "@/lib/server/campaigns/discount-campaign-service";
import {
  getBestsellerProducts,
  getCatalogProducts,
  getCollectionsFromDb,
  getFeaturedRailProducts,
  getPreferenceRecommendations,
} from "@/lib/server/products";

export async function GET() {
  try {
    const [catalog, user] = await Promise.all([getCatalogProducts(), readSessionUser()]);
    const favoriteStone =
      user?.favoriteStone === "diamond" ||
      user?.favoriteStone === "emerald" ||
      user?.favoriteStone === "sapphire" ||
      user?.favoriteStone === "ruby" ||
      user?.favoriteStone === "turquoise" ||
      user?.favoriteStone === "onyx" ||
      user?.favoriteStone === "zabarjad" ||
      user?.favoriteStone === "yemen-aqeeq" ||
      user?.favoriteStone === "durr-najaf" ||
      user?.favoriteStone === "moral"
        ? user.favoriteStone
        : null;
    const favoriteStyle =
      user?.favoriteStyle === "solitaire" ||
      user?.favoriteStyle === "halo" ||
      user?.favoriteStyle === "vintage" ||
      user?.favoriteStyle === "signet" ||
      user?.favoriteStyle === "eternity" ||
      user?.favoriteStyle === "stackable"
        ? user.favoriteStyle
        : null;
    const favoriteBudgetBand =
      user?.favoriteBudgetBand === "entry" ||
      user?.favoriteBudgetBand === "mid" ||
      user?.favoriteBudgetBand === "premium" ||
      user?.favoriteBudgetBand === "luxury"
        ? user.favoriteBudgetBand
        : null;
    const personalized = getPreferenceRecommendations(
      catalog,
      {
        favoriteStone,
        favoriteStyle,
        favoriteBudgetBand,
      },
      10
    );
    const [collections, testimonials, instagramPosts, banner, sliders, campaigns] =
      await Promise.all([
      getCollectionsFromDb(),
      listHomeTestimonials(),
      listHomeInstagramPosts(),
      getHomeBannerSettings(),
      resolveHomeSliderProducts(catalog, 6),
      listActivePublicCampaigns(),
    ]);

    return ok({
      sliders,
      bestsellers: getBestsellerProducts(catalog, 12),
      featuredRail: getFeaturedRailProducts(catalog, 10),
      personalized,
      collections,
      testimonials: testimonials.map(({ id, name, location, text, rating }) => ({
        id,
        name,
        location,
        text,
        rating,
      })),
      instagramPosts: instagramPosts.map(({ id, image, likes }) => ({
        id,
        image,
        likes,
      })),
      banner,
      campaigns: campaigns.filter((c) => c.banner.enabled),
    }, {
      headers: {
        "Cache-Control": user
          ? "private, max-age=30, stale-while-revalidate=60"
          : "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/home" });
  }
}
