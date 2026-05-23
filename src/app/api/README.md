# API Contracts Map

All handlers are in `route.ts`. Business logic should stay in `src/lib/server/*`.

## Errors & logging
- Use `handleRouteError(error, { route: "/api/..." })` in `catch` blocks (see `src/lib/server/route-errors.ts`)
- Structured logs: `serverLogger` in `src/lib/observability/logger.ts`
- Sentry: set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` — see `src/lib/observability/README.md`

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
- `GET /api/products/search?q=` - catalog + telegram text search (used by header preview and `/shop?q=`)
- `GET /api/products/[id]` - product details + related
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
- `POST /api/promo/validate` - validate promo code against cart subtotal
- `GET|POST /api/admin/promo-codes` - promo CRUD list/create (admin)
- `PATCH|DELETE /api/admin/promo-codes/[id]` - promo update/delete (admin)
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
