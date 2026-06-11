import { defaultHomeBannerDto } from "@/lib/home-banner-defaults";
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
import type { HomeBannerDto } from "@/lib/types/home-content";
import type { Product } from "@/lib/types";

type HomeCollection = {
  id: string;
  name: string;
  namePersian: string;
};

type HomeTestimonial = {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
};

type HomeInstagramPost = {
  id: string;
  image: string;
  likes: number;
};

export type HomePageData = {
  sliders: Product[];
  bestsellers: Product[];
  featuredRail: Product[];
  personalized: Product[];
  collections: HomeCollection[];
  testimonials: HomeTestimonial[];
  instagramPosts: HomeInstagramPost[];
  banner: HomeBannerDto;
  campaigns: Awaited<ReturnType<typeof listActivePublicCampaigns>>;
};

export async function getHomePageData(): Promise<HomePageData> {
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
  const [collections, testimonials, instagramPosts, banner, sliders, campaigns] = await Promise.all([
    getCollectionsFromDb(),
    listHomeTestimonials(),
    listHomeInstagramPosts(),
    getHomeBannerSettings(),
    resolveHomeSliderProducts(catalog, 6),
    listActivePublicCampaigns(),
  ]);

  return {
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
    banner: banner ?? defaultHomeBannerDto(),
    campaigns: campaigns.filter((c) => c.banner.enabled),
  };
}
