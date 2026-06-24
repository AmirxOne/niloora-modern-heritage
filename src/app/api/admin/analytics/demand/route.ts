export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getAdminDemandAnalytics } from "@/lib/server/admin/demand-analytics";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const demand = await getAdminDemandAnalytics();
    return ok({ demand });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/analytics/demand" });
  }
}
