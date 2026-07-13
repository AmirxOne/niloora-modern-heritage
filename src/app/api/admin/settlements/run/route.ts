export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { runSettlementEngine } from "@/lib/server/marketplace/settlement/settlement-service";
import {
  dispatchDomainEvents,
  ensureDefaultDomainEventHandlers,
} from "@/lib/server/marketplace/events/domain-events";

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const result = await runSettlementEngine({ actorId: user?.id ?? null });

    await writeAdminAuditLog({
      user,
      request,
      action: "settlement.run",
      route: "/api/admin/settlements/run",
      entityType: "settlement",
      summary: `settled ${result.settled}/${result.evaluated} groups, net ${result.totalNetSettled}`,
      payload: {
        evaluated: result.evaluated,
        settled: result.settled,
        deduped: result.deduped,
        skipped: result.skipped,
        totalNetSettled: result.totalNetSettled,
      },
    });

    ensureDefaultDomainEventHandlers();
    const dispatch = await dispatchDomainEvents();

    return ok({ settlement: result, dispatch });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/settlements/run" });
  }
}
