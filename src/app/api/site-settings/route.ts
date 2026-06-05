export { dynamic } from "@/lib/server/route-segment";

import { getPublicSiteSettings } from "@/lib/server/site-settings/site-settings";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return ok({ settings });
  } catch (error) {
    return handleRouteError(error, { route: "/api/site-settings" });
  }
}
