export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { runSettlementEngine } from "@/lib/server/marketplace/settlement/settlement-service";
import { acquireSettlementRunLock } from "@/lib/server/marketplace/settlement/settlement-run-lock";
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

export async function POST(request: Request) {
  const critical = createCriticalFlowContext(request, {
    route: "/api/admin/settlements/run",
    role: "admin",
    journey: "admin_finance",
    action: "settlement_run",
  });
  logCriticalStart(critical);
  let currentUser: Awaited<ReturnType<typeof readSessionUser>> | null = null;
  let lock: ReturnType<typeof acquireSettlementRunLock> | null = null;
  try {
    const user = await readSessionUser();
    currentUser = user;
    const denied = ensureAdmin(user);
    if (denied) {
      await writeAdminAuditLog({
        user,
        request,
        action: "settlement.run.denied",
        route: "/api/admin/settlements/run",
        entityType: "settlement",
        summary: "deny settlement run by role",
        payload: { reason: "admin_access_required" },
      });
      logCriticalOutcome(critical, "blocked", { code: "admin_access_required" });
      return withCorrelationId(denied, critical.correlationId);
    }

    lock = acquireSettlementRunLock();
    if (!lock) {
      logCriticalOutcome(critical, "blocked", { code: "settlement_run_in_progress" });
      return withCorrelationId(
        NextResponse.json(
          {
            code: "settlement_run_in_progress",
            message: "اجرای تسویه قبلی هنوز در حال انجام است. لطفاً کمی بعد دوباره تلاش کنید.",
          },
          { status: 409 }
        ),
        critical.correlationId
      );
    }

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

    logCriticalOutcome(critical, "success", { settled: result.settled, skipped: result.skipped });
    return withCorrelationId(ok({ settlement: result, dispatch }), critical.correlationId);
  } catch (error) {
    await writeAdminAuditLog({
      user: currentUser,
      request,
      action: "settlement.run.failed",
      route: "/api/admin/settlements/run",
      entityType: "settlement",
      summary: "settlement run failed",
      payload: {
        message: error instanceof Error ? error.message : "unknown_error",
      },
    });
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/admin/settlements/run",
      request,
      role: "admin",
      journey: "admin_finance",
      action: "settlement_run",
    });
  } finally {
    lock?.release();
  }
}
