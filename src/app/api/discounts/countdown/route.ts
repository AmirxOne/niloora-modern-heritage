export { dynamic } from "@/lib/server/route-segment";

import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getDiscountCountdownConfig } from "@/lib/server/discounts/countdown";

export async function GET() {
  try {
    const countdown = await getDiscountCountdownConfig();
    return ok(countdown);
  } catch (error) {
    return handleRouteError(error, { route: "/api/discounts/countdown" });
  }
}
