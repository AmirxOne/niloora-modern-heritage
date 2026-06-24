# API Contracts Map

All handlers are in `route.ts`. Business logic should stay in `src/lib/server/*`.

## Errors & logging
- Use `handleRouteError(error, { route: "/api/..." })` in `catch` blocks (see `src/lib/server/route-errors.ts`)
- Structured logs: `serverLogger` in `src/lib/observability/logger.ts`
- Sentry: set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` — see `src/lib/observability/README.md`
- Production env + cron: **`docs/production.md`**

## Health
- `GET /api/health` — liveness (`status`, `healthy`)
- `GET /api/health?detailed=1` — DB + SMS/Zarinpal/Sentry checks; optional `x-health-secret` if `HEALTH_CHECK_SECRET` is set

## Tests (Vitest)
- `npm run test` — pricing, promo validation, auth phone/session JWT, order creation (mocked DB)
- CI: `.github/workflows/ci.yml` runs lint, test, build

## Auth
- `POST /api/auth/login` - password login
- `POST /api/auth/register` - password register + session
- `POST /api/auth/logout` - destroy current session + clear cookie
- `GET /api/auth/session` - current user session DTO
- `POST /api/auth/otp/request` - issue OTP; SMS via Kavenegar in production; `otpPreview` only in development
- `POST /api/auth/otp/verify` - consume OTP, create session, upsert user
- `POST /api/auth/forgot-password/request` - issue reset token
- `POST /api/auth/forgot-password/reset` - consume reset token and set new password

## Account / User Data
- `GET /api/account` - session user + account stats
- `PATCH /api/account` - editable profile fields
- `GET /api/user/preferences` - persisted cart/wishlist/compare/recently-viewed/design/promo (designs merged local+server on login client-side)
- Order creation: `POST /api/payments/zarinpal/request` (authoritative `repriceOrderItems`; `POST /api/orders` disabled)
- `PUT /api/user/preferences` - upsert preferences

## Customizer
- `GET /api/customizer/quote-requests` - list workshop quote requests for session user
- `POST /api/customizer/quote-requests` - save configuration with `pending-quote` (no online payment)

## Commerce
- `GET /api/products` - catalog + max price
- `GET /api/products/search?q=` - catalog text search (used by header preview and `/shop?q=`)
- `GET /api/products/[id]` - product details + related
- `GET /api/authenticity/verify?pieceCode=...` - public authenticity verification by Piece Code + verification history logging
- `GET /api/product-questions?productId=...&status=approved` - list approved product questions + answers
- `POST /api/product-questions` - submit pending product question (requires session)
- `POST /api/product-questions/[id]/answers` - submit pending answer for approved question (requires session)
- `GET /api/product-questions/pending` - admin pending queue for questions and answers
- `PATCH /api/product-questions/[id]` - admin approve/reject question
- `PATCH /api/product-questions/answers/[id]` - admin approve/reject answer
- `GET /api/products/pre-owned` - pre-owned catalog
- `GET /api/products/sales` - sold quantity aggregation
- `GET /api/collections` - collection metadata
- `GET /api/orders` - user orders
- `POST /api/orders` - disabled (use payment flow)
- `POST /api/payments/zarinpal/request` - create pending order + redirect to Zarinpal (session user or guest resolved from shipping mobile/email)
- `GET /api/payments/zarinpal/callback` - verify payment, finalize order on success (sends order-placed SMS/email)
- `POST /api/trade-in` - submit pre-owned sell form
- `POST /api/support-requests` - post-purchase return / support request (optional session + orderId)
- `POST /api/abandoned-cart` - save abandoned-cart reminder target (sms/email + cart snapshot + checkout path)
- `POST /api/abandoned-cart/recover` - mark reminder token as recovered after direct return
- `POST /api/cron/abandoned-cart-recovery` - send due reminders (cron; requires `x-cron-secret`)
- `POST /api/cron/messaging-journeys` - run automated journeys (welcome/birthday/winback/order follow-up/maintenance reminders/price drop; requires `x-cron-secret`)
- `GET /api/price-drop/unsubscribe?token=...` - unsubscribe user from price-drop alert channel
- `GET /api/referrals/summary` - referral dashboard for logged-in user (code, credit, invite stats)
- `POST /api/gift-cards/validate` - validate gift card for checkout and return applied amount
- `GET /api/gift-cards/balance?code=...` - check gift card balance
- `GET /api/bundles/active` - active bundle offers for client pricing/product page
- `GET|POST /api/admin/bundles` - list/create bundle offers (admin)
- `PATCH|DELETE /api/admin/bundles/[id]` - update/delete bundle offers (admin)
- `GET|POST /api/admin/gift-cards` - list/create gift cards (admin)
- `PATCH /api/admin/gift-cards/[id]` - activate/deactivate or update expiry/note (admin)
- `POST /api/promo/validate` - validate promo code against cart subtotal
- `GET|POST /api/admin/promo-codes` - promo CRUD list/create (admin)
- `PATCH|DELETE /api/admin/promo-codes/[id]` - promo update/delete (admin)
- `GET|POST /api/admin/promo-codes/csv` - promo Excel (.xlsx) export/import with validation report (admin)
- `GET|POST /api/admin/products/csv` - product Excel export/import with row-level errors (admin)
- `GET|POST /api/admin/orders/csv` - orders Excel export/import (status/tracking updates + errors) (admin)
- `GET /api/admin/finance/csv` - finance transactions Excel export (admin)
- `GET|POST /api/admin/media` - admin media list/upload (with WebP optimization)
- `DELETE /api/admin/media/[id]` - remove media asset from manager
- `GET /api/admin/audit-logs` - query admin audit trail (`q`, `action`, `entityType`, `actorId`, `from`, `to`, `limit`)
- `GET /api/admin/ab-tests/results?experimentId=` - aggregate A/B test results by variant (admin)
- `GET /api/admin/trade-in?status=` - list trade-in submissions (admin)
- `PATCH /api/admin/trade-in/[id]` - update status + internalNotes (admin)
- `GET /api/admin/support-requests?status=&kind=` - list support/return requests (admin)
- `PATCH /api/admin/support-requests/[id]` - update status + internalNotes (admin)

## Content / Home
- `GET /api/posts` - published blog posts list
- `GET /api/posts/[slug]` - single published post
- `GET|POST /api/admin/posts` - blog CMS list/create (admin)
- `PATCH|DELETE /api/admin/posts/[id]` - blog post update/delete (admin)
- `GET /api/home` - home composites (sliders, banner, collections, testimonials, instagram)
- `GET /api/home/banner` - promo banner settings (shop + cart)
- `GET|PATCH /api/admin/home/banner` - manage promo banner (admin)
- `GET|POST /api/admin/home/slider` - home product slider (admin)
- `PATCH|DELETE /api/admin/home/slider/[id]` - slider item (admin)
- `GET|POST /api/admin/home/testimonials` - testimonials (admin)
- `PATCH|DELETE /api/admin/home/testimonials/[id]` - testimonial (admin)
- `GET|POST /api/admin/home/instagram` - instagram gallery (admin)
- `PATCH|DELETE /api/admin/home/instagram/[id]` - instagram post (admin)
- `POST /api/ab/events` - track A/B exposure/conversion events
- `POST /api/analytics/funnel` - track standardized commerce funnel events (`view_product` → `purchase`)
- `GET /api/admin/home/kpi` - admin KPI dashboard (conversion, AOV, stone sales, daily/weekly/monthly sales)

## Comments / Moderation
- `GET /api/comments?productId=...` - list comments (approved by default)
- `POST /api/comments` - submit pending comment (requires session)
- `GET /api/comments/pending` - admin pending queue
- `PATCH /api/comments/[id]` - admin approve/reject
- `GET /api/product-questions/pending` - admin pending queue for questions and answers
- `PATCH /api/product-questions/[id]` - admin approve/reject question
- `PATCH /api/product-questions/answers/[id]` - admin approve/reject answer

## Important Security Notes
- Admin checks use `ensureAdmin` from `src/lib/server/auth/guards.ts`
- Session trust boundary is in `src/lib/server/auth/session.ts`
- Response helpers are centralized in `src/lib/server/http.ts`
