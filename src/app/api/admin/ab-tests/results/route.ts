export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getAbResults } from "@/lib/server/ab/results";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const url = new URL(request.url);
    const experimentId = url.searchParams.get("experimentId")?.trim() || undefined;
    const results = await getAbResults(experimentId);
    return ok({ results });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/ab-tests/results" });
  }
}
