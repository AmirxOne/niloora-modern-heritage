# Order notifications

Customer notifications after checkout and admin status updates.

## Channels

| Event | When | SMS | Email |
|-------|------|-----|-------|
| `order_placed` | Zarinpal payment verified → order `processing` | `shippingPhone` or user phone | User `email` if set + Resend configured |
| `order_shipped` | Admin sets status to `shipped` | same | same |
| `order_tracking` | Tracking code updated while already `shipped` | same | same |

## Env

- `NOTIFY_ENABLED` — default `true`; set `false` to disable all sends
- `KAVENEGAR_SENDER` + `KAVENEGAR_API_KEY` — plain SMS in production
- `KAVENEGAR_TEMPLATE_ORDER_PLACED` / `KAVENEGAR_TEMPLATE_ORDER_SHIPPED` — optional Lookup templates
- `NOTIFY_EMAIL_ENABLED=true`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — optional email via [Resend](https://resend.com)

## Development

In non-production, messages are logged as `[notify:sms:preview]` / `[notify:email:preview]` without calling providers.

## Idempotency

`OrderNotification` table stores one row per `(orderId, kind, channel)` to avoid duplicate SMS on payment callback retries.
