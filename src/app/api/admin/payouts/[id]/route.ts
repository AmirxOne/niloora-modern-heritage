export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { prisma } from "@/lib/server/prisma";
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
    route: "/api/admin/payouts/[id]",
    role: "admin",
    journey: "admin_finance",
    action: "payout_action",
  });
  logCriticalStart(critical);
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) {
      await writeAdminAuditLog({
        user,
        request,
        action: "payout.action.denied",
        route: "/api/admin/payouts/[id]",
        entityType: "payout",
        summary: "deny payout action by role",
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

    if (!isPayoutAction(action)) {
      await writeAdminAuditLog({
        user,
        request,
        action: "payout.action.denied",
        route: "/api/admin/payouts/[id]",
        entityType: "payout",
        entityId: id,
        summary: "deny payout action invalid action",
        payload: { reason: "invalid_action", action },
      });
      logCriticalOutcome(critical, "blocked", { code: "payout_invalid_action", action });
      return withCorrelationId(
        badRequest("عملیات نامعتبر است.", "payout_invalid_action"),
        critical.correlationId
      );
    }
    if ((action === "reject" || action === "fail") && !reason) {
      logCriticalOutcome(critical, "blocked", { code: "payout_reason_required", action });
      return withCorrelationId(
        badRequest("برای عملیات رد یا ناموفق، درج دلیل الزامی است.", "payout_reason_required"),
        critical.correlationId
      );
    }
    if (reason && reason.length > 500) {
      logCriticalOutcome(critical, "blocked", { code: "payout_reason_too_long", action });
      return withCorrelationId(
        badRequest("طول دلیل حداکثر ۵۰۰ کاراکتر است.", "payout_reason_too_long"),
        critical.correlationId
      );
    }
    if (note && note.length > 500) {
      logCriticalOutcome(critical, "blocked", { code: "payout_note_too_long", action });
      return withCorrelationId(
        badRequest("طول یادداشت حداکثر ۵۰۰ کاراکتر است.", "payout_note_too_long"),
        critical.correlationId
      );
    }

    const current = await prisma.payout.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!current) {
      logCriticalOutcome(critical, "blocked", { code: "payout_not_found" });
      return withCorrelationId(notFound("درخواست تسویه یافت نشد."), critical.correlationId);
    }
    if (expectedStatus && expectedStatus !== current.status) {
      await writeAdminAuditLog({
        user,
        request,
        action: `payout.${action}.denied`,
        route: "/api/admin/payouts/[id]",
        entityType: "payout",
        entityId: id,
        summary: "deny payout action by stale state",
        payload: {
          reason: "expected_status_mismatch",
          expectedStatus,
          currentStatus: current.status,
        },
      });
      logCriticalOutcome(critical, "blocked", { code: "payout_status_mismatch", action });
      return withCorrelationId(
        jsonConflict(
          `وضعیت درخواست تغییر کرده است. وضعیت فعلی: ${current.status}`,
          "payout_status_mismatch"
        ),
        critical.correlationId
      );
    }

    try {
      const payout = await applyPayoutAction(id, action, {
        changedById: user?.id ?? null,
        reason,
        note,
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

      logCriticalOutcome(critical, "success", { action, payoutId: payout.id, status: payout.status });
      return withCorrelationId(ok({ payout: toPayoutDto(payout) }), critical.correlationId);
    } catch (err) {
      if (err instanceof PayoutNotFoundError) {
        await writeAdminAuditLog({
          user,
          request,
          action: `payout.${action}.failed`,
          route: "/api/admin/payouts/[id]",
          entityType: "payout",
          entityId: id,
          summary: "payout action failed - not found",
          payload: { code: err.code, message: err.message },
        });
        logCriticalOutcome(critical, "blocked", { code: err.code, action });
        return withCorrelationId(notFound(err.message), critical.correlationId);
      }
      if (err instanceof PayoutTransitionError || err instanceof PayoutConflictError) {
        await writeAdminAuditLog({
          user,
          request,
          action: `payout.${action}.failed`,
          route: "/api/admin/payouts/[id]",
          entityType: "payout",
          entityId: id,
          summary: "payout action failed - conflict",
          payload: { code: "payout_transition_conflict", message: err.message },
        });
        logCriticalOutcome(critical, "blocked", { code: "payout_transition_conflict", action });
        return withCorrelationId(
          jsonConflict(err.message, "payout_transition_conflict"),
          critical.correlationId
        );
      }
      if (err instanceof PayoutError) {
        await writeAdminAuditLog({
          user,
          request,
          action: `payout.${action}.failed`,
          route: "/api/admin/payouts/[id]",
          entityType: "payout",
          entityId: id,
          summary: "payout action failed - validation",
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
      route: "/api/admin/payouts/[id]",
      request,
      role: "admin",
      journey: "admin_finance",
      action: "payout_action",
    });
  }
}
