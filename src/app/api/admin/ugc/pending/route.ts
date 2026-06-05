export { dynamic } from "@/lib/server/route-segment";

import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { listPendingUgcForAdmin } from "@/lib/server/ugc/ugc-media";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;
    const items = await listPendingUgcForAdmin();
    return ok({ items });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/ugc/pending" });
  }
}
