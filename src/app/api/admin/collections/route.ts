export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCollectionsFromDb } from "@/lib/server/products";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const collections = await getCollectionsFromDb();
    return ok({ collections });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/collections" });
  }
}
