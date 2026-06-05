export { dynamic } from "@/lib/server/route-segment";

import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { buildEnvHealthReport } from "@/lib/server/env-validate";

/**
 * Liveness/readiness probe.
 * - `GET /api/health` — lightweight (no DB)
 * - `GET /api/health?detailed=1` — DB + effective Zarinpal; requires `x-health-secret` if HEALTH_CHECK_SECRET is set
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "1";
    const healthSecret = process.env.HEALTH_CHECK_SECRET?.trim() ?? "";

    if (detailed && healthSecret) {
      const provided = request.headers.get("x-health-secret")?.trim() ?? "";
      if (provided !== healthSecret) return unauthorized("forbidden");
    }

    const report = await buildEnvHealthReport({
      includeDatabase: detailed,
      includeEffectiveZarinpal: detailed,
    });

    const httpStatus = report.status === "error" ? 503 : 200;
    return ok(
      {
        status: report.status,
        environment: report.environment,
        ...(detailed ? { checks: report.checks } : { healthy: report.status === "ok" }),
      },
      { status: httpStatus }
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/health" });
  }
}
