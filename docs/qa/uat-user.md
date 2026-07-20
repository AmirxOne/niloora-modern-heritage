# UAT Checklist - User

## Preconditions

- Test user exists or can be created via OTP/password flow.
- SMS/OTP preview or test OTP path is enabled in non-production environment.
- User starts with known profile state (or baseline captured).
- At least one purchasable product exists.

## Step-by-Step Actions

1. Open `/auth` and authenticate as user.
2. Verify redirect back to target path after login (if entered from protected route).
3. Open `/account` and verify profile + stats payload renders.
4. Update profile fields in `/account`:
   - first name, last name
   - national code/postal code
   - favorites/preferences
5. Browse `/shop` and add product to cart.
6. Open `/cart` and run through checkout entry flow until payment handoff boundary.
7. Open user order surfaces:
   - `/orders` or profile order section
8. Call user API endpoints with authenticated session:
   - `GET /api/account`
   - `PATCH /api/account`
   - `GET /api/orders`

## Expected Results

- Login/session is established and stable across route transitions.
- `/account` loads with consistent stats and preference values.
- Profile update validates and persists accepted fields.
- Invalid fields are rejected with actionable messages.
- Cart and checkout entry enforce availability/price validation.
- User endpoints return authenticated data without role escalation leaks.
- Error responses include consistent shape; failed calls carry `x-correlation-id`.

## Negative Tests

1. Login with invalid credentials:
   - expect `401` with explicit error.
2. Trigger login rate limit:
   - repeated bad attempts should return `429`.
3. Patch invalid profile payload (bad national code, future birth date):
   - expect `400`.
4. Access admin/vendor endpoints as user:
   - expect `403` or redirect (page) and `401/403` (API).

## Rollback / Cleanup

- Revert modified profile fields to baseline values.
- Remove test cart items.
- Cancel or flag any incomplete checkout artifacts.
- Log correlation IDs for failed auth/account calls.
