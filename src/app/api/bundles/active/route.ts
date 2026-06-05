export { dynamic } from "@/lib/server/route-segment";

import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listActiveBundleOffers } from "@/lib/server/bundle/bundle-offer-service";

export async function GET() {
  try {
    const bundles = await listActiveBundleOffers();
    return ok({ bundles });
  } catch (error) {
    return handleRouteError(error, { route: "/api/bundles/active" });
  }
}
