import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/observability/sentry-config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

type LogEntry = {
  ts: string;
  level: LogLevel;
  service: string;
  runtime: "server" | "client" | "edge";
  msg: string;
  context?: LogContext;
  err?: {
    name: string;
    message: string;
    stack?: string;
  };
};

function serializeError(error: unknown): LogEntry["err"] | undefined {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (error !== undefined && error !== null) {
    return { name: "UnknownError", message: String(error) };
  }
  return undefined;
}

function write(entry: LogEntry): void {
  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `[${entry.level}] ${entry.msg}${
          entry.context ? ` ${JSON.stringify(entry.context)}` : ""
        }${entry.err ? ` ${entry.err.message}` : ""}`;

  if (entry.level === "error") {
    console.error(line);
    return;
  }
  if (entry.level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function captureToSentry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
) {
  if (!isSentryEnabled()) return;

  Sentry.withScope((scope) => {
    scope.setTag("logger", "structured");
    if (context) scope.setContext("log", context);
    if (level === "error" && error) {
      Sentry.captureException(error, { extra: { message, ...context } });
      return;
    }
    Sentry.captureMessage(message, level === "warn" ? "warning" : level);
  });
}

function log(
  runtime: LogEntry["runtime"],
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
) {
  write({
    ts: new Date().toISOString(),
    level,
    service: "niloora",
    runtime,
    msg: message,
    context,
    err: serializeError(error),
  });

  if (level === "error" || level === "warn") {
    captureToSentry(level, message, context, error);
  }
}

export const serverLogger = {
  debug: (message: string, context?: LogContext) => log("server", "debug", message, context),
  info: (message: string, context?: LogContext) => log("server", "info", message, context),
  warn: (message: string, context?: LogContext, error?: unknown) =>
    log("server", "warn", message, context, error),
  error: (message: string, context?: LogContext, error?: unknown) =>
    log("server", "error", message, context, error),
};

export const clientLogger = {
  debug: (message: string, context?: LogContext) => log("client", "debug", message, context),
  info: (message: string, context?: LogContext) => log("client", "info", message, context),
  warn: (message: string, context?: LogContext, error?: unknown) =>
    log("client", "warn", message, context, error),
  error: (message: string, context?: LogContext, error?: unknown) =>
    log("client", "error", message, context, error),
};
