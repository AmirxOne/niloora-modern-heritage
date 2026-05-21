import { NextResponse } from "next/server";
import { serverLogger } from "@/lib/observability/logger";
import { serverError } from "@/lib/server/http";

export type RouteErrorContext = {
  route: string;
  message?: string;
  context?: Record<string, unknown>;
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
  return serverError(input.message);
}
