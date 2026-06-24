export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { updateVendorProfile } from "@/lib/server/vendor/vendor-service";

export async function PATCH(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as {
      displayName?: string;
      displayNameFa?: string | null;
      description?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
    };

    const vendor = await updateVendorProfile(user.id, body);
    return ok({ vendor });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/profile" });
  }
}
