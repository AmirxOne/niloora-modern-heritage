export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getVendorForUser } from "@/lib/server/vendor/vendor-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const vendor = await getVendorForUser(user.id);
    return ok({ vendor });
  } catch (error) {
    return handleRouteError(error, { route: "/api/vendor/me" });
  }
}
