import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/observability/sentry-config";
import { serverLogger, type LogContext } from "@/lib/observability/logger";

const CORRELATION_ID_HEADER = "x-correlation-id";
const FALLBACK_REQUEST_ID_HEADER = "x-request-id";

export type CriticalRole = "guest" | "user" | "vendor" | "editor" | "reviewer" | "admin" | "system";

export type CriticalFlowInput = {
  route: string;
  role: CriticalRole;
  journey: string;
  action: string;
  userId?: string | null;
  entityId?: string | null;
};

export type CriticalFlowContext = CriticalFlowInput & {
  correlationId: string;
  method: string;
  startedAtMs: number;
};

export function getCorrelationIdFromHeaders(headers: Headers): string {
  const provided =
    headers.get(CORRELATION_ID_HEADER)?.trim() || headers.get(FALLBACK_REQUEST_ID_HEADER)?.trim();
  return provided || crypto.randomUUID();
}

export function createCriticalFlowContext(
  request: Request,
  input: CriticalFlowInput
): CriticalFlowContext {
  return {
    ...input,
    method: request.method,
    startedAtMs: Date.now(),
    correlationId: getCorrelationIdFromHeaders(request.headers),
  };
}

export function withCorrelationId<T extends Response>(response: T, correlationId: string): T {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
}

export function logCriticalStart(context: CriticalFlowContext, extra?: LogContext): void {
  serverLogger.info("critical_flow_start", {
    correlationId: context.correlationId,
    method: context.method,
    route: context.route,
    role: context.role,
    journey: context.journey,
    action: context.action,
    userId: context.userId ?? null,
    entityId: context.entityId ?? null,
    ...extra,
  });
}

export function logCriticalOutcome(
  context: CriticalFlowContext,
  outcome: "success" | "blocked" | "failed",
  extra?: LogContext
): void {
  const payload = {
    correlationId: context.correlationId,
    method: context.method,
    route: context.route,
    role: context.role,
    journey: context.journey,
    action: context.action,
    userId: context.userId ?? null,
    entityId: context.entityId ?? null,
    durationMs: Math.max(0, Date.now() - context.startedAtMs),
    outcome,
    ...extra,
  };

  if (outcome === "failed") {
    serverLogger.error("critical_flow_outcome", payload);
    return;
  }
  if (outcome === "blocked") {
    serverLogger.warn("critical_flow_outcome", payload);
    return;
  }
  serverLogger.info("critical_flow_outcome", payload);
}

export function captureCriticalFailure(
  context: CriticalFlowContext,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  if (!isSentryEnabled()) return;

  Sentry.withScope((scope) => {
    scope.setTag("critical_flow", "true");
    scope.setTag("role", context.role);
    scope.setTag("journey", context.journey);
    scope.setTag("action", context.action);
    scope.setTag("route", context.route);
    scope.setTag("correlation_id", context.correlationId);
    scope.setContext("critical_flow", {
      correlationId: context.correlationId,
      method: context.method,
      userId: context.userId ?? null,
      entityId: context.entityId ?? null,
      ...extra,
    });
    Sentry.captureException(error);
  });
}
