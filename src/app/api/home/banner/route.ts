import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getHomeBannerSettings } from "@/lib/server/home/home-banner";

export async function GET() {
  try {
    const banner = await getHomeBannerSettings();
    return ok({ banner });
  } catch (error) {
    return handleRouteError(error, { route: "/api/home/banner" });
  }
}
