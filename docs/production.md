# Production readiness

Checklist for deploying Niloora to a stateless host (Vercel, Docker, VPS).

## Required environment variables (production)

The server **fails fast on runtime startup** (`next start`, not `next build`) when `NODE_ENV=production` and these are missing:

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | PostgreSQL connection |
| `SESSION_SECRET` | Session cookie signing (min 16 chars recommended) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL (or `NEXT_PUBLIC_APP_URL` / `APP_URL`) — sitemap, payment callbacks, cron links |
| `ABANDONED_CART_CRON_SECRET` | Shared secret for scheduled cron HTTP calls |

Copy `.env.example` and fill values before `npm run build` / `npm run start`.

## Integrations (validated at startup / health)

### SMS / OTP (Kavenegar)

Required in production when `NOTIFY_ENABLED=true` (default):

| Variable | Required | Notes |
|----------|----------|-------|
| `KAVENEGAR_API_KEY` | yes | API key from Kavenegar panel |
| `KAVENEGAR_OTP_TEMPLATE` | yes | Verify Lookup template name (`%token` = OTP) |
| `KAVENEGAR_SENDER` | no | Line number for plain SMS fallback |
| `KAVENEGAR_TEMPLATE_ORDER_PLACED` | no | Lookup template for order placed |
| `KAVENEGAR_TEMPLATE_ORDER_SHIPPED` | no | Lookup template for shipped |

See `src/lib/server/sms/README.md`.

### Zarinpal payments

| Variable | Required | Notes |
|----------|----------|-------|
| `ZARINPAL_MERCHANT_ID` | env or DB | Merchant can also live in admin **site settings** |
| `ZARINPAL_SANDBOX` | — | Set `false` for live payments |

Startup warns if env merchant is empty (DB override may still work).

### Sentry

| Variable | Notes |
|----------|-------|
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Same DSN value (server + client) |
| `SENTRY_ENABLED=false` | Disable observability explicitly |
| `SENTRY_ENVIRONMENT` | e.g. `production` |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Optional — source maps on build |

See `src/lib/observability/README.md`.

### Email (optional)

| Variable | Notes |
|----------|-------|
| `NOTIFY_EMAIL_ENABLED=true` | Enables Resend |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender |

## Cron jobs (HTTP)

Both endpoints use **POST** and require header:

```http
x-cron-secret: <ABANDONED_CART_CRON_SECRET>
```

Unauthorized or missing secret → `401`.

### Abandoned cart recovery

**`POST /api/cron/abandoned-cart-recovery`**

- Sends due abandoned-cart SMS/email reminders (`AbandonedCartRecovery` rows with `status=pending` and `nextReminderAt <= now`).
- Respects `ABANDONED_CART_ENABLED` (default `true`).
- Processes up to 300 rows per run.

**Suggested schedule:** every 15–30 minutes.

```bash
curl -sS -X POST "https://YOUR_DOMAIN/api/cron/abandoned-cart-recovery" \
  -H "x-cron-secret: $ABANDONED_CART_CRON_SECRET"
```

**Response example:**

```json
{ "processed": 12, "sent": 10, "failed": 2 }
```

### Messaging journeys

**`POST /api/cron/messaging-journeys`**

Runs automated journeys in parallel:

| Journey | Purpose |
|---------|---------|
| `birthday` | Users with birthday today |
| `winback` | Users without recent purchase |
| `orderFollowup` | Recent paid orders in `processing` |
| `maintenance` | Polish / stone-check reminders |
| `priceDrop` | Wishlist price-drop alerts |

Respects `NOTIFY_ENABLED` (returns `400 notifications_disabled` when off).

**Suggested schedule:** once daily (e.g. 09:00 Asia/Tehran).

```bash
curl -sS -X POST "https://YOUR_DOMAIN/api/cron/messaging-journeys" \
  -H "x-cron-secret: $ABANDONED_CART_CRON_SECRET"
```

**Response example:**

```json
{
  "birthday": { "sent": 2, "skipped": 10 },
  "winback": { "sent": 5, "skipped": 100 },
  "orderFollowup": { "sent": 3, "skipped": 20 },
  "maintenance": { "sent": 1, "skipped": 50 },
  "priceDrop": { "sent": 4, "skipped": 200 }
}
```

### Vercel Cron (example)

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/abandoned-cart-recovery",
      "schedule": "*/20 * * * *"
    },
    {
      "path": "/api/cron/messaging-journeys",
      "schedule": "0 5 * * *"
    }
  ]
}
```

Vercel cron invokes **GET** by default — you may need an external scheduler (GitHub Actions, cron on VPS, Upstash QStash) that sends **POST** with `x-cron-secret`, or add a thin proxy.

### systemd timer (VPS example)

```ini
# /etc/systemd/system/niloora-cron-abandoned.service
[Service]
Type=oneshot
EnvironmentFile=/etc/niloora/env
ExecStart=/usr/bin/curl -sS -X POST https://example.com/api/cron/abandoned-cart-recovery -H "x-cron-secret: ${ABANDONED_CART_CRON_SECRET}"
```

## Health check

| Endpoint | Use |
|----------|-----|
| `GET /api/health` | Liveness — no DB; returns `{ status, environment, healthy }` |
| `GET /api/health?detailed=1` | Readiness — DB ping + env/integration checks |

If `HEALTH_CHECK_SECRET` is set, detailed mode requires header `x-health-secret: <HEALTH_CHECK_SECRET>`.

- `status: ok` → HTTP 200
- `status: degraded` → HTTP 200 (some non-critical checks failed)
- `status: error` → HTTP 503 (e.g. database down)

## Deploy steps

1. Set all production env vars on the host.
2. `npm run prisma:migrate:deploy`
3. `npm run build`
4. `npm run start`
5. Configure cron scheduler for both `/api/cron/*` endpoints.
6. Hit `GET /api/health?detailed=1` after deploy.

## Related docs

- `src/app/api/README.md` — API map
- `src/lib/server/notifications/README.md` — notification events
- `src/lib/server/sms/README.md` — Kavenegar OTP
- `src/lib/observability/README.md` — Sentry
