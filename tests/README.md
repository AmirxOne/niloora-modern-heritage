# Niloora Test Suite

Automated tests for the Niloora storefront and admin panel.

## Structure

```
tests/
├── unit/              # Pure logic (Jest, node)
├── components/        # React components (Jest + RTL, jsdom)
├── integration/       # API route handlers (Jest, mocked Prisma/auth)
├── e2e/               # Browser flows (Playwright)
├── fixtures/          # Shared test data
├── helpers/           # Response parsers and utilities
└── jest.setup.ts
```

Existing Vitest tests under `src/**/*.test.ts` remain the fast inner loop for lib modules.

## Commands

| Script | Description |
|--------|-------------|
| `npm run test` | Vitest (existing `src/` unit tests) |
| `npm run test:jest` | All Jest tests in `tests/` |
| `npm run test:jest:unit` | Unit tests only |
| `npm run test:jest:integration` | Integration tests only |
| `npm run test:jest:components` | RTL component tests |
| `npm run test:e2e` | Playwright E2E (starts dev server) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:all` | Vitest + Jest + E2E |

## Environment

Jest setup (`tests/jest.setup.ts`) sets:

- `SESSION_SECRET` — minimum 32 characters
- `DATABASE_URL` — defaults to `postgresql://localhost:5432/niloora_test`

Integration tests **mock** Prisma and session — no live database required.

## E2E

Playwright uses `playwright.config.ts` at the repo root.

- `E2E_BASE_URL` — override target (default `http://127.0.0.1:3000`)
- `E2E_SKIP_SERVER=1` — reuse an already-running dev server

```bash
# Terminal 1
npm run dev

# Terminal 2
E2E_SKIP_SERVER=1 npm run test:e2e
```

## Coverage map

| Area | Unit | Integration | E2E |
|------|------|-------------|-----|
| Authentication | `unit/auth/` | `integration/api/auth-otp.test.ts` | `e2e/auth.spec.ts` |
| Product browsing | `unit/catalog/`, `unit/product/` | `integration/api/products.test.ts` | `e2e/shop-browsing.spec.ts` |
| Search | `unit/catalog/search.test.ts` | `integration/api/products-search.test.ts` | `e2e/search-filters.spec.ts` |
| Filters | `unit/catalog/filters.test.ts` | — | `e2e/search-filters.spec.ts` |
| Cart | `unit/cart/` | `integration/api/cart-validate.test.ts` | `e2e/cart-checkout.spec.ts` |
| Checkout | `unit/orders/shipping-cost.test.ts` | `integration/api/promo-validate.test.ts` | `e2e/cart-checkout.spec.ts` |
| Orders | `unit/orders/order-timeline.test.ts` | `integration/api/orders.test.ts` | `e2e/cart-checkout.spec.ts` |
| Profile | — | `integration/api/account.test.ts` | `e2e/orders-profile.spec.ts` |
| Admin dashboard | — | — | `e2e/admin-dashboard.spec.ts` |
| Product management | — | `integration/api/admin-products.test.ts` | `e2e/admin-product-management.spec.ts` |
| Order management | — | `integration/api/admin-orders.test.ts` | `e2e/admin-order-management.spec.ts` |
