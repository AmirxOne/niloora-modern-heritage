import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getHomeBannerSettings } from "@/lib/server/home/home-banner";
import { resolveHomeSliderProducts } from "@/lib/server/home/home-slider";
import { listHomeInstagramPosts } from "@/lib/server/home/home-instagram";
import { listHomeTestimonials } from "@/lib/server/home/home-testimonials";
import {
  getBestsellerProducts,
  getCatalogProducts,
  getCollectionsFromDb,
  getFeaturedRailProducts,
} from "@/lib/server/products";

export async function GET() {
  try {
    const catalog = await getCatalogProducts();
    const [collections, testimonials, instagramPosts, banner, sliders] = await Promise.all([
      getCollectionsFromDb(),
      listHomeTestimonials(),
      listHomeInstagramPosts(),
      getHomeBannerSettings(),
      resolveHomeSliderProducts(catalog, 6),
    ]);

    return ok({
      sliders,
      bestsellers: getBestsellerProducts(catalog, 12),
      featuredRail: getFeaturedRailProducts(catalog, 10),
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
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/home" });
  }
}
