import { NextResponse } from "next/server";
import { serverLogger } from "@/lib/observability/logger";
import { serverError } from "@/lib/server/http";
import {
  captureCriticalFailure,
  createCriticalFlowContext,
  withCorrelationId,
  type CriticalRole,
} from "@/lib/observability/critical-flow";

export type RouteErrorContext = {
  route: string;
  message?: string;
  context?: Record<string, unknown>;
  request?: Request;
  role?: CriticalRole;
  journey?: string;
  action?: string;
};

export function logRouteError(error: unknown, input: RouteErrorContext): void {
  serverLogger.error(input.message ?? "Route handler failed", {
    route: input.route,
    ...input.context,
  }, error);
}

export function handleRouteError(
  error: unknown,
  input: RouteErrorContext
): NextResponse<{ message: string }> {
  logRouteError(error, input);
  if (input.request && input.role && input.journey && input.action) {
    const criticalContext = createCriticalFlowContext(input.request, {
      route: input.route,
      role: input.role,
      journey: input.journey,
      action: input.action,
    });
    captureCriticalFailure(criticalContext, error, input.context);
    const response = serverError(input.message);
    return withCorrelationId(response, criticalContext.correlationId);
  }
  const response = serverError(input.message);
  if (!input.request) return response;
  const correlationId =
    input.request.headers.get("x-correlation-id")?.trim() ||
    input.request.headers.get("x-request-id")?.trim() ||
    crypto.randomUUID();
  return withCorrelationId(response, correlationId);
}
