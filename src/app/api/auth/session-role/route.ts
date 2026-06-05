export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

/**
 * Lightweight role lookup for edge middleware — validates cookie against DB session.
 */
export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    return ok({
      role: user.role,
      blocked: user.blocked ?? false,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/session-role" });
  }
}
