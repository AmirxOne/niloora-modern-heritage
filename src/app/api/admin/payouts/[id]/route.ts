export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, conflict, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import {
  applyPayoutAction,
  isPayoutAction,
  PayoutConflictError,
  PayoutError,
  PayoutNotFoundError,
  PayoutTransitionError,
} from "@/lib/server/marketplace/payout/payout-service";
import { toPayoutDto } from "@/lib/server/marketplace/payout/payout-dto";
import {
  dispatchDomainEvents,
  ensureDefaultDomainEventHandlers,
} from "@/lib/server/marketplace/events/domain-events";

type ActionBody = {
  action?: string;
  reason?: string | null;
  note?: string | null;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as ActionBody;
    const action = body.action?.trim() ?? "";

    if (!isPayoutAction(action)) {
      return badRequest("عملیات نامعتبر است.");
    }

    try {
      const payout = await applyPayoutAction(id, action, {
        changedById: user?.id ?? null,
        reason: body.reason ?? null,
        note: body.note ?? null,
      });

      await writeAdminAuditLog({
        user,
        request,
        action: `payout.${action}`,
        route: "/api/admin/payouts/[id]",
        entityType: "payout",
        entityId: payout.id,
        summary: `payout ${payout.id} -> ${payout.status}`,
        payload: { payoutId: payout.id, action, status: payout.status },
      });

      ensureDefaultDomainEventHandlers();
      await dispatchDomainEvents();

      return ok({ payout: toPayoutDto(payout) });
    } catch (err) {
      if (err instanceof PayoutNotFoundError) return notFound(err.message);
      if (err instanceof PayoutTransitionError || err instanceof PayoutConflictError) {
        return conflict(err.message);
      }
      if (err instanceof PayoutError) {
        return badRequest(err.message, err.code);
      }
      throw err;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/payouts/[id]" });
  }
}
