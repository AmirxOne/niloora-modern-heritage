export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listPendingVendors } from "@/lib/server/vendor/vendor-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const vendors = await listPendingVendors();
    return ok({ vendors });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/vendors/pending" });
  }
}
