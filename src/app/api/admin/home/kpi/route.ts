import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getAdminHomeKpis } from "@/lib/server/home/admin-kpi";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const kpi = await getAdminHomeKpis();
    return ok({ kpi });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/kpi" });
  }
}
