# Observability

## Structured logging

- `serverLogger` / `clientLogger` in `src/lib/observability/logger.ts`
- Development: readable console lines
- Production: one JSON object per line (`level`, `msg`, `context`, `err`, …)
- `error` / `warn` also forward to Sentry when DSN is configured

## API routes

```typescript
import { handleRouteError } from "@/lib/server/route-errors";

export async function GET() {
  try {
    // ...
  } catch (error) {
    return handleRouteError(error, { route: "/api/example" });
  }
}
```

## Sentry

1. Create a project at [sentry.io](https://sentry.io)
2. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (same value)
3. Optional: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps on build
4. Disable locally: `SENTRY_ENABLED=false`

Configs: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`.

Client boundaries: `src/app/error.tsx`, `src/app/global-error.tsx`, `ClientObservability` in root layout.
