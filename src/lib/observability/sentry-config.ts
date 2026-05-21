import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";

export type SentryRuntime = "server" | "client" | "edge";

function parseSampleRate(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) return fallback;
  return value;
}

export function isSentryEnabled(): boolean {
  if (process.env.SENTRY_ENABLED === "false") return false;
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
}

function baseOptions(runtime: SentryRuntime): BrowserOptions | NodeOptions | EdgeOptions {
  const dsn =
    runtime === "client"
      ? process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
      : process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  return {
    dsn,
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    release: process.env.SENTRY_RELEASE?.trim() || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
      return event;
    },
  };
}

export function getServerSentryOptions(): NodeOptions {
  return {
    ...baseOptions("server"),
    integrations: (defaults) => defaults,
  };
}

export function getEdgeSentryOptions(): EdgeOptions {
  return baseOptions("edge") as EdgeOptions;
}

export function getClientSentryOptions(): BrowserOptions {
  return {
    ...baseOptions("client"),
    replaysSessionSampleRate: parseSampleRate(
      process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      0
    ),
    replaysOnErrorSampleRate: parseSampleRate(
      process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      0.1
    ),
  };
}
