export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, conflict, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import {
  applyRefundAction,
  isRefundAction,
} from "@/lib/server/marketplace/refund/refund-service";
import {
  RefundConflictError,
  RefundError,
  RefundNotFoundError,
} from "@/lib/server/marketplace/refund/refund-errors";
import { RefundTransitionError } from "@/lib/server/marketplace/refund/refund-state-machine";
import { toRefundDto } from "@/lib/server/marketplace/refund/refund-dto";
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

    if (!isRefundAction(action)) {
      return badRequest("عملیات نامعتبر است.");
    }

    try {
      const refund = await applyRefundAction(id, action, {
        changedById: user?.id ?? null,
        reason: body.reason ?? null,
        note: body.note ?? null,
      });

      await writeAdminAuditLog({
        user,
        request,
        action: `refund.${action}`,
        route: "/api/admin/refunds/[id]",
        entityType: "refund",
        entityId: refund.id,
        summary: `refund ${refund.id} -> ${refund.status}`,
        payload: { refundId: refund.id, action, status: refund.status },
      });

      ensureDefaultDomainEventHandlers();
      await dispatchDomainEvents();

      return ok({ refund: toRefundDto(refund) });
    } catch (err) {
      if (err instanceof RefundNotFoundError) return notFound(err.message);
      if (err instanceof RefundTransitionError || err instanceof RefundConflictError) {
        return conflict(err.message);
      }
      if (err instanceof RefundError) {
        return badRequest(err.message, err.code);
      }
      throw err;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/refunds/[id]" });
  }
}
