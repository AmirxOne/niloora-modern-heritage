export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getVendorDashboard } from "@/lib/server/vendor/vendor-dashboard-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const dashboard = await getVendorDashboard(user.id);
    return ok({ dashboard });
  } catch (error) {
    return handleRouteError(error, { route: "/api/vendor/dashboard" });
  }
}
