export { dynamic } from "@/lib/server/route-segment";

import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { buildEnvHealthReport } from "@/lib/server/env-validate";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
} from "@/lib/observability/critical-flow";

const HEALTH_RECOMMENDATIONS: Record<string, string> = {
  sessionSecret: "Set SESSION_SECRET with at least 16 characters.",
  siteUrl: "Set NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL / APP_URL).",
  cronSecret: "Set ABANDONED_CART_CRON_SECRET for scheduled jobs.",
  sms: "Configure KAVENEGAR keys or disable NOTIFY_ENABLED.",
  zarinpalEnv: "Set ZARINPAL_MERCHANT_ID in env for payment readiness.",
  sentry: "Set SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN or disable SENTRY_ENABLED.",
  database: "Check DATABASE_URL, DB connectivity, and Prisma migration state.",
  zarinpalEffective: "Enable and configure payment gateway in site settings.",
};

/**
 * Liveness/readiness probe.
 * - `GET /api/health` — lightweight (no DB)
 * - `GET /api/health?detailed=1` — DB + effective Zarinpal; requires `x-health-secret` if HEALTH_CHECK_SECRET is set
 */
export async function GET(request: Request) {
  const critical = createCriticalFlowContext(request, {
    route: "/api/health",
    role: "system",
    journey: "platform_health",
    action: "health_probe",
  });
  logCriticalStart(critical);
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "1";
    const healthSecret = process.env.HEALTH_CHECK_SECRET?.trim() ?? "";

    if (detailed && healthSecret) {
      const provided = request.headers.get("x-health-secret")?.trim() ?? "";
      if (provided !== healthSecret) {
        logCriticalOutcome(critical, "blocked", { code: "forbidden_health_probe" });
        return withCorrelationId(unauthorized("forbidden"), critical.correlationId);
      }
    }

    const report = await buildEnvHealthReport({
      includeDatabase: detailed,
      includeEffectiveZarinpal: detailed,
    });
    const failedChecks = Object.entries(report.checks)
      .filter(([, check]) => !check.ok)
      .map(([check, details]) => ({
        check,
        detail: details.detail ?? null,
        recommendation: HEALTH_RECOMMENDATIONS[check] ?? "Investigate service configuration and runtime logs.",
      }));
    const summary = {
      totalChecks: Object.keys(report.checks).length,
      failedChecks: failedChecks.length,
      degraded: report.status === "degraded",
      error: report.status === "error",
    };

    const httpStatus = report.status === "error" ? 503 : 200;
    logCriticalOutcome(critical, "success", { status: report.status, failedChecks: failedChecks.length });
    return withCorrelationId(
      ok(
        {
          status: report.status,
          environment: report.environment,
          correlationId: critical.correlationId,
          summary,
          ...(detailed
            ? {
                checks: report.checks,
                failedChecks,
              }
            : { healthy: report.status === "ok" }),
        },
        { status: httpStatus }
      ),
      critical.correlationId
    );
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/health",
      request,
      role: "system",
      journey: "platform_health",
      action: "health_probe",
    });
  }
}
