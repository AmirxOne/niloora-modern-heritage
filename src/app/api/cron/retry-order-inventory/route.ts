export { dynamic } from "@/lib/server/route-segment";

import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverEnv } from "@/lib/server/env";
import { retryPendingOrderInventory } from "@/lib/server/inventory/retry-pending-inventory";

export async function POST(request: Request) {
  try {
    const provided = request.headers.get("x-cron-secret")?.trim() ?? "";
    if (!serverEnv.inventoryRetryCronSecret || provided !== serverEnv.inventoryRetryCronSecret) {
      return unauthorized("forbidden");
    }

    const result = await retryPendingOrderInventory();
    return ok(result);
  } catch (error) {
    return handleRouteError(error, { route: "/api/cron/retry-order-inventory" });
  }
}
