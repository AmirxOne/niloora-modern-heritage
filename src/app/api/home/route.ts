export { dynamic } from "@/lib/server/route-segment";

import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { getHomePageData } from "@/lib/server/home/get-home-page-data";

export async function GET() {
  try {
    const [payload, user] = await Promise.all([getHomePageData(), readSessionUser()]);

    return ok(
      {
        sliders: payload.sliders,
        bestsellers: payload.bestsellers,
        featuredRail: payload.featuredRail,
        personalized: payload.personalized,
        collections: payload.collections,
        testimonials: payload.testimonials,
        instagramPosts: payload.instagramPosts,
        banner: payload.banner,
        campaigns: payload.campaigns,
        popularArtisans: payload.popularArtisans,
        blogPosts: payload.blogPosts,
      },
      {
        headers: {
          "Cache-Control": user
            ? "private, max-age=30, stale-while-revalidate=60"
            : "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/home" });
  }
}
