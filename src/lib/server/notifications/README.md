# Order notifications

Customer notifications after checkout and admin status updates.

## Channels

| Event | When | SMS | Email |
|-------|------|-----|-------|
| `order_placed` | Zarinpal payment verified → order `processing` | `shippingPhone` or user phone | User `email` if set + Resend configured |
| `order_shipped` | Admin sets status to `shipped` | same | same |
| `order_tracking` | Tracking code updated while already `shipped` | same | same |

## Automated Messaging Journeys

| Journey | Trigger | Channel |
|--------|---------|---------|
| `welcome` | On first successful signup/login-create (`register`, OTP new user) | SMS + Email |
| `birthday` | Daily cron on users whose `birthDate` matches today | SMS + Email |
| `abandoned_cart` | Existing abandoned-cart reminder flow | SMS/Email by selected channel |
| `winback` | Cron for users without any purchase in recent window | SMS + Email |
| `order_followup` | Cron for recently paid `processing` orders | SMS + Email |
| `maintenance_polish` | Scheduled after paid order (+45 days) | SMS + Email |
| `maintenance_stone_check` | Scheduled after paid order (+90 days) | SMS + Email |
| `price_drop` | Cron compares wishlist baseline price with current product price | SMS + Email (with unsubscribe token) |

Cron endpoints (see **`docs/production.md`** for schedules and examples):
- `POST /api/cron/messaging-journeys` with `x-cron-secret: ABANDONED_CART_CRON_SECRET`
- `POST /api/cron/abandoned-cart-recovery` with the same secret
- `GET /api/price-drop/unsubscribe?token=...` for per-channel unsubscribe

## Env

- `NOTIFY_ENABLED` — default `true`; set `false` to disable all sends
- `KAVENEGAR_SENDER` + `KAVENEGAR_API_KEY` — plain SMS in production
- `KAVENEGAR_TEMPLATE_ORDER_PLACED` / `KAVENEGAR_TEMPLATE_ORDER_SHIPPED` — optional Lookup templates
- `NOTIFY_EMAIL_ENABLED=true`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — optional email via [Resend](https://resend.com)
- `ABANDONED_CART_CRON_SECRET` — reused for journey cron authorization

## Development

In non-production, messages are logged as `[notify:sms:preview]` / `[notify:email:preview]` without calling providers.

## Idempotency

`OrderNotification` table stores one row per `(orderId, kind, channel)` to avoid duplicate SMS on payment callback retries.
`AutomatedJourneyEvent` stores one row per `(journey, channel, fingerprint)` to avoid duplicate journey sends.
