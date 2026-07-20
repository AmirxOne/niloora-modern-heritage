export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { prisma } from "@/lib/server/prisma";
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
import { NextResponse } from "next/server";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
} from "@/lib/observability/critical-flow";

type ActionBody = {
  action?: string;
  expectedStatus?: string | null;
  reason?: string | null;
  note?: string | null;
};

function jsonConflict(message: string, code: string) {
  return NextResponse.json({ code, message }, { status: 409 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const critical = createCriticalFlowContext(request, {
    route: "/api/admin/refunds/[id]",
    role: "admin",
    journey: "admin_finance",
    action: "refund_action",
  });
  logCriticalStart(critical);
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) {
      await writeAdminAuditLog({
        user,
        request,
        action: "refund.action.denied",
        route: "/api/admin/refunds/[id]",
        entityType: "refund",
        summary: "deny refund action by role",
        payload: { reason: "admin_access_required" },
      });
      logCriticalOutcome(critical, "blocked", { code: "admin_access_required" });
      return withCorrelationId(denied, critical.correlationId);
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as ActionBody;
    const action = body.action?.trim() ?? "";
    const expectedStatus = body.expectedStatus?.trim() || null;
    const reason = body.reason?.trim() || null;
    const note = body.note?.trim() || null;

    if (!isRefundAction(action)) {
      await writeAdminAuditLog({
        user,
        request,
        action: "refund.action.denied",
        route: "/api/admin/refunds/[id]",
        entityType: "refund",
        entityId: id,
        summary: "deny refund action invalid action",
        payload: { reason: "invalid_action", action },
      });
      logCriticalOutcome(critical, "blocked", { code: "refund_invalid_action", action });
      return withCorrelationId(
        badRequest("عملیات نامعتبر است.", "refund_invalid_action"),
        critical.correlationId
      );
    }
    if ((action === "reject" || action === "fail") && !reason) {
      logCriticalOutcome(critical, "blocked", { code: "refund_reason_required", action });
      return withCorrelationId(
        badRequest("برای عملیات رد یا ناموفق، درج دلیل الزامی است.", "refund_reason_required"),
        critical.correlationId
      );
    }
    if (reason && reason.length > 500) {
      logCriticalOutcome(critical, "blocked", { code: "refund_reason_too_long", action });
      return withCorrelationId(
        badRequest("طول دلیل حداکثر ۵۰۰ کاراکتر است.", "refund_reason_too_long"),
        critical.correlationId
      );
    }
    if (note && note.length > 500) {
      logCriticalOutcome(critical, "blocked", { code: "refund_note_too_long", action });
      return withCorrelationId(
        badRequest("طول یادداشت حداکثر ۵۰۰ کاراکتر است.", "refund_note_too_long"),
        critical.correlationId
      );
    }

    const current = await prisma.refund.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!current) {
      logCriticalOutcome(critical, "blocked", { code: "refund_not_found" });
      return withCorrelationId(notFound("درخواست بازپرداخت یافت نشد."), critical.correlationId);
    }
    if (expectedStatus && expectedStatus !== current.status) {
      await writeAdminAuditLog({
        user,
        request,
        action: `refund.${action}.denied`,
        route: "/api/admin/refunds/[id]",
        entityType: "refund",
        entityId: id,
        summary: "deny refund action by stale state",
        payload: {
          reason: "expected_status_mismatch",
          expectedStatus,
          currentStatus: current.status,
        },
      });
      logCriticalOutcome(critical, "blocked", { code: "refund_status_mismatch", action });
      return withCorrelationId(
        jsonConflict(
          `وضعیت درخواست تغییر کرده است. وضعیت فعلی: ${current.status}`,
          "refund_status_mismatch"
        ),
        critical.correlationId
      );
    }

    try {
      const refund = await applyRefundAction(id, action, {
        changedById: user?.id ?? null,
        reason,
        note,
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

      logCriticalOutcome(critical, "success", { action, refundId: refund.id, status: refund.status });
      return withCorrelationId(ok({ refund: toRefundDto(refund) }), critical.correlationId);
    } catch (err) {
      if (err instanceof RefundNotFoundError) {
        await writeAdminAuditLog({
          user,
          request,
          action: `refund.${action}.failed`,
          route: "/api/admin/refunds/[id]",
          entityType: "refund",
          entityId: id,
          summary: "refund action failed - not found",
          payload: { code: err.code, message: err.message },
        });
        logCriticalOutcome(critical, "blocked", { code: err.code, action });
        return withCorrelationId(notFound(err.message), critical.correlationId);
      }
      if (err instanceof RefundTransitionError || err instanceof RefundConflictError) {
        await writeAdminAuditLog({
          user,
          request,
          action: `refund.${action}.failed`,
          route: "/api/admin/refunds/[id]",
          entityType: "refund",
          entityId: id,
          summary: "refund action failed - conflict",
          payload: { code: "refund_transition_conflict", message: err.message },
        });
        logCriticalOutcome(critical, "blocked", { code: "refund_transition_conflict", action });
        return withCorrelationId(
          jsonConflict(err.message, "refund_transition_conflict"),
          critical.correlationId
        );
      }
      if (err instanceof RefundError) {
        await writeAdminAuditLog({
          user,
          request,
          action: `refund.${action}.failed`,
          route: "/api/admin/refunds/[id]",
          entityType: "refund",
          entityId: id,
          summary: "refund action failed - validation",
          payload: { code: err.code, message: err.message },
        });
        logCriticalOutcome(critical, "blocked", { code: err.code, action });
        return withCorrelationId(badRequest(err.message, err.code), critical.correlationId);
      }
      throw err;
    }
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/admin/refunds/[id]",
      request,
      role: "admin",
      journey: "admin_finance",
      action: "refund_action",
    });
  }
}
