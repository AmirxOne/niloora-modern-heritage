export { dynamic } from "@/lib/server/route-segment";

import { ok, unauthorized, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { toSessionUser } from "@/lib/server/auth/dto";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    return ok({ user: toSessionUser(user) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/session" });
  }
}
