export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getAdminVendorFinance } from "@/lib/server/marketplace/payout/admin-vendor-finance-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const finance = await getAdminVendorFinance();
    return ok({ finance });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/finance/vendors" });
  }
}
