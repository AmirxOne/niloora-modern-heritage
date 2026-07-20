export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { submitVendorApplication } from "@/lib/server/vendor/vendor-service";
import { requireVendorOwner } from "@/lib/server/vendor/vendor-guards";

export async function POST() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    await requireVendorOwner(user.id);

    const vendor = await submitVendorApplication(user.id);
    return ok({ vendor });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/submit" });
  }
}
