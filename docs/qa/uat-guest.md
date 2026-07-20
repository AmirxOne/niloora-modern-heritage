# UAT Checklist - Guest

## Preconditions

- Environment is reachable and healthy:
  - `GET /api/health` returns `200` or `503` with structured payload.
- Guest browser session starts clean (no auth cookie, no local storage session artifacts).
- At least one active product exists in catalog.
- Tester has access to browser DevTools network tab for redirect/status checks.

## Step-by-Step Actions

1. Open `/`.
2. Open `/shop`.
3. Use search with a valid query (example: Persian keyword for rings).
4. Open a product details page from search results.
5. Open `/cart`.
6. Attempt to open protected pages:
   - `/account`
   - `/admin`
   - `/vendor/dashboard`
7. Call public APIs:
   - `GET /api/products`
   - `GET /api/products/search?q=<valid>`
8. Call guarded APIs as guest:
   - `GET /api/orders`
   - `POST /api/vendor/media` with any file payload

## Expected Results

- Public pages load without fatal errors.
- Search returns structured result payload and non-crashing UI behavior.
- Product page renders and add-to-cart flow does not break.
- Protected pages redirect to `/auth?redirect=<path>` deterministically.
- Public APIs return `200` and valid schema.
- Guarded APIs return `401` for guest access.
- Failures include meaningful `code/message` payloads and `x-correlation-id` header.

## Negative Tests

1. Search with missing query:
   - `GET /api/products/search`
   - expect `400`.
2. Search with overlong query (`>120` chars):
   - expect `400`.
3. Submit malformed cart validation payload:
   - `POST /api/cart/validate` with invalid shape
   - expect `400` and no server crash.
4. Try direct checkout/order creation without prerequisites:
   - expect rejection with explicit error.

## Rollback / Cleanup

- Clear browser cookies and local storage.
- Remove test cart items if persisted in guest storage.
- Save failed request correlation IDs and screenshots to QA report.
