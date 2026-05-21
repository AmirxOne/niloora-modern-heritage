# Server Helpers Map

Server-only helpers used by API route handlers.

## Auth (`auth/`)
- `session.ts` - create/read/destroy cookie sessions
- `dto.ts` - DB user -> session-safe DTO
- `otp.ts` - OTP issue + verification
- `sms/` - Kavenegar OTP delivery (production)
- `auth/otp-rate-limit.ts` - layered OTP rate limits
- `password-reset.ts` - reset token lifecycle
- `guards.ts` - role guards (admin check)

## Commerce / Data
- `products.ts` - DB product/collection loaders and mappers
- `order-pricing.ts` - authoritative repricing for checkout
- `preferences.ts` - persisted user preference DTO read/write
- `rate-limit.ts` - in-memory API limiter helpers
- `http.ts` - normalized response helpers
- `prisma.ts` - Prisma singleton

## Security Boundaries
- Never trust client totals or client role flags.
- Always gate admin routes with `ensureAdmin`.
- Keep DTO shaping explicit (avoid returning raw Prisma models).
