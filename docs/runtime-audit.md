# Niloora — Runtime & QA Audit Report

**Generated:** 2026-06-06  
**Role:** Senior QA Engineer (read-only analysis)  
**Scope:** Full codebase — runtime errors, crashes, async/state risks, dead code, UX gaps  
**Automated checks:** `npm run test` — 80/80 passed · `npm run lint` — 0 errors, 1 warning

---

## Executive Summary

Niloora is a mature Next.js e-commerce app with solid baseline patterns: most API routes use `try/catch` + `handleRouteError`, admin routes enforce role guards, and unit tests cover pricing/auth/cart logic. However, several **production-facing risks** were identified:

| Severity | Count |
|----------|-------|
| **Critical** | 2 |
| **High** | 12 |
| **Medium** | 24 |
| **Low** | 18 |
| **Total** | 56 |

**Top risks:**

1. **Payment callback** — early Prisma/session work outside `try/catch` can return raw 500s after a successful charge.
2. **Moderation data leak** — public GET endpoints expose `?status=pending` comments/questions without auth.
3. **Login preference race** — server cart merge can be overwritten by debounced local persist within 350ms.
4. **Orphaned payment orders** — gift-card purchase lacks Zarinpal-failure rollback (unlike main checkout).
5. **Large dead-code surface** — ~24 unused components + 5 dashboard duplicates increase maintenance and bundle risk.

---

## Table of Contents

1. [Critical Findings](#critical-findings)
2. [High Findings](#high-findings)
3. [Medium Findings](#medium-findings)
4. [Low Findings](#low-findings)
5. [Findings by Category](#findings-by-category)
6. [Dead Code Inventory](#dead-code-inventory)
7. [Duplicate Code Patterns](#duplicate-code-patterns)
8. [Positive Observations](#positive-observations)
9. [Recommended Fix Priority](#recommended-fix-priority)

---

## Critical Findings

### C-01 — Payment callback can 500 after successful user payment

| Field | Detail |
|-------|--------|
| **Category** | Unhandled exceptions, Runtime errors |
| **Files** | `src/app/api/payments/zarinpal/callback/route.ts` |
| **Lines** | 43–98 (outside `try` at line 100) |

**Issue:** The handler performs `prisma.payment.findUnique`, `logPaymentEvent`, `fail()` (with `$transaction`), and `createSession`/`setSessionCookie` for already-paid orders **before** the main `try` block. Any DB outage, session creation failure, or transaction error on the idempotent re-entry path surfaces as an unhandled 500 instead of a user-facing redirect.

**Impact:** User may be charged (Zarinpal `Status=OK`) but see a generic error page; order may be `paid` while UI shows failure.

**Evidence:**

```34:98:src/app/api/payments/zarinpal/callback/route.ts
export async function GET(request: Request) {
  // ... authority check ...
  const payment = await prisma.payment.findUnique({ ... });  // NOT in try/catch
  // ...
  if (payment.status === "paid") {
    const sessionToken = await createSession(payment.order.userId);  // NOT in try/catch
    await setSessionCookie(sessionToken);
    return redirect(paymentReturnPath(payment.order, "success"));
  }
  try { /* verify flow */ }
```

---

### C-02 — Unauthenticated access to pending moderation queues via public GET

| Field | Detail |
|-------|--------|
| **Category** | Authorization flow, Security |
| **Files** | `src/app/api/comments/route.ts`, `src/app/api/product-questions/route.ts` |

**Issue:** Both endpoints accept arbitrary `?status=` query values with **no session or admin check**. A caller can enumerate `?status=pending` to read unmoderated user content (names, bodies, ratings) before approval.

**Impact:** Pre-moderation content exposure; potential PII leak; undermines moderation workflow.

**Evidence (`comments`):**

```35:39:src/app/api/comments/route.ts
    if (status) {
      where.status = status;
    } else {
      where.status = "approved";
    }
```

**Evidence (`product-questions`):**

```72:73:src/app/api/product-questions/route.ts
    const where: { productId: string; status?: string } = { productId };
    where.status = status ?? "approved";
```

---

## High Findings

### H-01 — Gift-card purchase leaves orphan `pending_payment` orders on gateway failure

| Field | Detail |
|-------|--------|
| **Category** | Async issues, Missing error handling |
| **File** | `src/app/api/gift-cards/purchase/route.ts` |

**Issue:** Creates `order` + `payment` rows, then calls `zarinpalRequestPayment`. Unlike `POST /api/payments/zarinpal/request` (which has inner rollback logic), failures only hit the outer `catch` — no order/payment status cleanup.

**Impact:** Stale pending orders in DB; finance/admin noise; user confusion on retry.

---

### H-02 — Login preference sync vs. debounced persist race

| Field | Detail |
|-------|--------|
| **Category** | Race conditions, State management |
| **Files** | `src/lib/hooks/useUserPreferencesSync.ts`, `src/lib/hooks/usePersistUserPreferences.ts` |

**Issue:** On login, `useUserPreferencesSync` fetches server cart/wishlist and dispatches to Redux. `usePersistUserPreferences` debounces a `PUT` by **350ms** whenever cart/wishlist changes. If local state was populated before sync completes, the debounced PUT can **overwrite server preferences** with stale local data.

**Impact:** Cart/wishlist data loss or duplication after login; intermittent and hard to reproduce.

---

### H-03 — `CheckoutShippingForm` sessionStorage initializer causes hydration mismatch

| Field | Detail |
|-------|--------|
| **Category** | Hydration issues |
| **File** | `src/components/cart/CheckoutShippingForm.tsx` (lines 49–61) |

**Issue:** `useState` initializer reads `sessionStorage` on client but returns `emptyCheckoutShipping()` on server. SSR HTML and first client render can disagree on form field values.

**Impact:** React hydration warning; possible form field flicker; checkout validation edge cases.

---

### H-04 — `useAuthPage` redirects before session cookie is confirmed

| Field | Detail |
|-------|--------|
| **Category** | Race conditions, Broken navigation |
| **File** | `src/lib/hooks/useAuthPage.ts` (lines 16–19) |

**Issue:** Redirects when `auth.isLoggedIn` is true without waiting for `sessionResolved` or `syncSessionAfterLogin()`. Redux user can be set before the HTTP-only cookie is readable by middleware.

**Impact:** Brief redirect to `/account` → middleware bounce back to `/auth`; flaky post-login navigation for returning sessions.

**Note:** OTP verify on `auth/page.tsx` correctly awaits `syncSessionAfterLogin()` before `router.replace`, but `useAuthPage`'s parallel effect can still fire first for already-logged-in visitors.

---

### H-05 — `loadSession()` has no abort / stale-response guard

| Field | Detail |
|-------|--------|
| **Category** | Race conditions, Async issues |
| **Files** | `src/lib/context/AppContext.tsx`, `src/lib/hooks/useAuth.ts` |

**Issue:** `AppProvider` calls `loadSession()` on hydrate with no cancellation. A slow response after logout or navigation can still dispatch `setAuthUser` and restore stale auth.

**Impact:** Ghost logged-in state; incorrect nav/guards; security boundary confusion.

---

### H-06 — Dual session/profile sources race (`loadSession` vs `useAccount`)

| Field | Detail |
|-------|--------|
| **Category** | Race conditions, State management |
| **Files** | `src/lib/hooks/useAccount.ts` (line 113), `src/lib/hooks/useAuth.ts` |

**Issue:** Both `GET /api/auth/session` and `GET /api/account` call `dispatch(setAuthUser(...))`. Whichever completes last wins, potentially overwriting fresher role/profile data.

**Impact:** Admin role flicker; stale `tier`/`role` in header; incorrect admin nav visibility.

---

### H-07 — Payment return handler runs overlapping async side effects

| Field | Detail |
|-------|--------|
| **Category** | Race conditions, Async issues |
| **File** | `src/components/cart/CartPageContent.tsx` (lines 94–130) |

**Issue:** On `?payment=success`, fires concurrently: `cart.clearCart()`, `auth.loadSession()`, `orders.completePaidOrder()` / `loadOrders()`, and `router.replace()` — no sequencing or await.

**Impact:** Duplicate toasts, order history lag, preference sync/persist races, receipt redirect before orders load.

---

### H-08 — `useUserPreferencesSync` has no try/catch on fetch/JSON

| Field | Detail |
|-------|--------|
| **Category** | Unhandled exceptions |
| **File** | `src/lib/hooks/useUserPreferencesSync.ts` (lines 51–104) |

**Issue:** `apiFetch`, `response.json()`, and nested promo `fetch` are not wrapped in try/catch. Network failures or malformed JSON cause unhandled promise rejections.

**Impact:** Silent preference sync failure; possible console errors; logged-in users keep stale local state.

---

### H-09 — `useCartSanitize` implemented but never mounted

| Field | Detail |
|-------|--------|
| **Category** | Dead code, Missing error handling |
| **File** | `src/lib/hooks/useCartSanitize.ts` |

**Issue:** Hook sanitizes stale cart lines via `POST /api/cart/sanitize` but is **not wired** in `AppContext.tsx`. Fire-and-forget `run()` also lacks try/catch.

**Impact:** Dead catalog lines (discontinued products, price drift) persist in cart indefinitely; intended server validation never runs.

---

### H-10 — `register()` does not call `syncSessionAfterLogin()`

| Field | Detail |
|-------|--------|
| **Category** | Auth flow, Async issues |
| **File** | `src/lib/hooks/useAuth.ts` (lines 199–248) |

**Issue:** `login()` awaits `syncSessionAfterLogin()` after setting Redux user; `register()` dispatches user but **never** confirms cookie propagation.

**Impact:** Password registration (if used) may hit middleware auth failure on immediate redirect.

---

### H-11 — Customize page: failed product load → infinite skeleton

| Field | Detail |
|-------|--------|
| **Category** | Missing empty states, Missing error handling |
| **File** | `src/app/customize/page.tsx` (lines 316–328, 521+) |

**Issue:** On API failure, toast fires but `product` stays `null`. Render condition `loading || !product` shows skeleton forever — no error empty state or back navigation.

**Impact:** User trapped on loading UI after invalid/disabled product.

---

### H-12 — Public analytics/A/B ingest endpoints without rate limiting

| Field | Detail |
|-------|--------|
| **Category** | Missing error handling, External abuse |
| **Files** | `src/app/api/analytics/funnel/route.ts`, `src/app/api/ab/events/route.ts` |

**Issue:** Unauthenticated `POST` writes to filesystem JSONL (`data/analytics/funnel-events.jsonl`) and A/B log store. No rate limit (OTP routes have limits; these do not).

**Impact:** Disk fill, degraded I/O, inflated analytics, potential DoS on stateless hosts.

---

## Medium Findings

### M-01 — `useProductSalesSync`: `response.json()` not in try/catch

**File:** `src/lib/hooks/useProductSalesSync.ts`  
**Category:** Unhandled exceptions  
Network/parse failure → unhandled rejection in `useEffect`.

---

### M-02 — `usePromo.validatePromoApi`: raw fetch without try/catch

**File:** `src/lib/hooks/usePromo.ts` (lines 21–28)  
**Category:** Unhandled exceptions  
Used by `tryApply` and `usePromoBootstrap`; network errors propagate to callers.

---

### M-03 — `useGiftCardPurchase`: try/finally without catch

**File:** `src/lib/hooks/useGiftCardPurchase.ts` (lines 38–58)  
**Category:** Unhandled exceptions  
Network errors escape; only API-level failures show toast.

---

### M-04 — Multiple data hooks fetch without `AbortController`

**Files:** `useOrders.ts`, `useAccount.ts`, `useQuoteRequests.ts`, `useComments.ts`, `useCatalogProducts.ts`, `useProductUgc.ts`  
**Category:** Race conditions  
Fast auth changes or navigation can apply stale responses.

---

### M-05 — Customize page product fetch has no abort on `productId` change

**File:** `src/app/customize/page.tsx` (lines 302–331)  
**Category:** Race conditions  
Rapid product switching can set wrong product/config from stale fetch.

---

### M-06 — Debounced price preview can be overwritten by slower response

**File:** `src/app/customize/page.tsx` (lines 447+)  
**Category:** Race conditions  
No request sequencing/abort for `POST /api/ring-customization/price-preview`.

---

### M-07 — Redux cart/wishlist hydrated post-mount (badge flash)

**Files:** `src/lib/store/StoreProvider.tsx`, `src/components/layout/MobileBottomNav.tsx`  
**Category:** Hydration issues  
SSR/first paint shows count `0`; jumps after `hydrateCart()` in `useEffect`.

---

### M-08 — `RtlSwiper` reads `document.documentElement.dir` during render

**File:** `src/components/ui/RtlSwiper.tsx` (lines 54–58)  
**Category:** Hydration issues  
SSR defaults `true`; client may differ → Swiper `dir` prop mismatch.

---

### M-09 — `AuthGuard` returns null until `sessionResolved` (blank screen)

**File:** `src/components/auth/AuthGuard.tsx` (line 22)  
**Category:** Missing loading states  
`/account` can be blank for ~1s+ on slow networks (`loadSession` up to 8 retries).

---

### M-10 — `useSearchParams` without page-level `Suspense`

**Files:** `src/app/account/page.tsx`, `src/app/customize/page.tsx`, `src/app/guide/buying/page.tsx`  
**Category:** Async issues (Next.js)  
Shop/cart/auth correctly wrap in `Suspense`; these pages risk CSR bailout warnings.

---

### M-11 — Client auth redirects ignore locale prefix

**Files:** `AuthGuard.tsx`, `AdminGuard.tsx`, `useAdminAccess.ts`, `useCart.ts`  
**Category:** Broken navigation  
Hardcoded `/auth?redirect=...` without `localePath()`; middleware uses `${prefix}/auth`.

---

### M-12 — Locale infrastructure without localized route tree

**Files:** `src/lib/i18n/locales.ts`, `src/middleware.ts`, empty `src/app/[locale]/`  
**Category:** Broken navigation  
`/en/shop` likely 404; middleware strips locale only for auth logic.

---

### M-13 — Public `GET /api/products/sales` exposes aggregate sales

**File:** `src/app/api/products/sales/route.ts`  
**Category:** Authorization / data leak  
Unauthenticated per-product sold quantities.

---

### M-14 — Public `GET /api/gift-cards/balance` enables code probing

**File:** `src/app/api/gift-cards/balance/route.ts`  
**Category:** Authorization  
Anyone with a code can query balance/expiry without auth.

---

### M-15 — `createOrderFromCart` throws non-`CartPurchaseError` → 500

**File:** `src/lib/server/orders/create-order.ts`  
**Category:** Missing error handling  
`Invalid order payload` / `Invalid shipping destination` become generic 500s in checkout.

---

### M-16 — `notifyOrderPlaced` is fire-and-forget after payment verify

**File:** `src/app/api/payments/zarinpal/callback/route.ts` (line 166)  
**Category:** Async issues  
SMS/email failures are not awaited or surfaced; silent notification loss.

---

### M-17 — Account profile section falls through while `account.user` loads

**File:** `src/app/account/page.tsx` (lines 120–150)  
**Category:** Missing loading states  
`#profile` deep link shows overview skeleton instead of profile-specific loading.

---

### M-18 — Account hash section applied only in `useEffect` (flash)

**File:** `src/app/account/page.tsx` (lines 40–65)  
**Category:** Hydration / UX  
`/account#orders` briefly renders overview before switching.

---

### M-19 — `useHomeData` / `useCatalogProducts`: silent fetch failures

**Files:** `src/lib/hooks/useHomeData.ts`, `src/lib/hooks/useCatalogProducts.ts`  
**Category:** Missing error handling, Missing empty states  
Loading state exists; errors keep empty defaults with no user feedback.

---

### M-20 — `useOrderReturns` / `useQuoteRequests`: no error state, weak catch

**Files:** `src/lib/hooks/useOrderReturns.ts`, `src/lib/hooks/useQuoteRequests.ts`  
**Category:** Missing error handling  
`try/finally` without `catch` on some paths.

---

### M-21 — `useCart.addProduct` product prefetch fetch unguarded

**File:** `src/lib/hooks/useCart.ts` (lines 74–92)  
**Category:** Unhandled exceptions  
Prefetch `fetch` + `json()` not in try/catch.

---

### M-22 — `persistMiddleware` lists `auth/` prefix but never persists auth

**File:** `src/lib/store/middleware/persistMiddleware.ts` (lines 16–26, 48–79)  
**Category:** State management  
`hydrateAuth` only sets `hydrated: true`; misleading config for future auth persistence.

---

### M-23 — Guest checkout auto-creates users without explicit consent

**File:** `src/lib/server/auth/checkout-user.ts`  
**Category:** Business logic risk  
`resolveCheckoutUser` creates accounts from shipping phone during payment request.

---

### M-24 — ESLint: missing `useEffect` dependency in admin audit panel

**File:** `src/components/admin/AdminAuditLogPanel.tsx` (line 73)  
**Category:** Async / stale closure  
`react-hooks/exhaustive-deps` warning; audit log may not reload when `audit` object changes.

---

## Low Findings

### L-01 — Orphaned `comments` localStorage key defined but unused

**File:** `src/lib/store/storage.ts` (line 6)

### L-02 — Admin settings panel: failed load shows empty form, no error state

**File:** `src/components/admin/AdminSettingsPanel.tsx` (lines 107–109)

### L-03 — `gift-cards/purchase` returns 400 instead of 401 for unauthenticated users

**File:** `src/app/api/gift-cards/purchase/route.ts` (line 22)

### L-04 — `register()` path lacks `syncSessionAfterLogin` toast feedback (unlike OTP)

**File:** `src/lib/hooks/useAuth.ts`

### L-05 — `useHomeData`, `useCatalogProducts`, `useSiteBanner` — no retry on failure

Multiple read-only hooks.

### L-06 — `useComments` / `useProductQuestions` moderation loaders lack error state

Admin moderation panels may show empty queue on failure.

### L-07 — `parseJsonResponse` callers assume JSON body on non-JSON error responses

**File:** `src/lib/hooks/fetch-utils.ts` — can throw on HTML error pages.

### L-08 — `ProductSalesCount` + `ProductSalesStat` both on same product page

**File:** `src/app/product/[id]/ProductPageClient.tsx` — duplicate sales UI.

### L-09 — `discount-countdown.ts` thin re-export of `discount-countdown-math.ts`

Redundant indirection.

### L-10 — `src/lib/products/listings.ts` only used by seed, not runtime

Seed-only data in app tree.

### L-11 — Dev OTP preview shown in toast (`useAuth.requestOtp`)

Expected in dev; ensure never enabled in production builds.

### L-12 — `logout()` fire-and-forget `apiFetch` with `.catch(() => undefined)`

**File:** `src/lib/hooks/useAuth.ts` (line 252) — acceptable but server session may linger on network fail.

### L-13 — `AbandonedCartRecoveryCard` reads sessionStorage in effect only (OK)

No render-time access — lower risk than CheckoutShippingForm.

### L-14 — `funnel-log.ts` append with no rotation/size cap

Disk growth over time.

### L-15 — `AdminGuard` does not wait for Redux cart hydration

Admin actions depending on client cart unlikely but inconsistent guard timing.

### L-16 — `verifyOtp` + `auth/page.tsx` both call `syncSessionAfterLogin` (redundant)

Double retry loop; harmless but wasteful.

### L-17 — `login`/`register` pages redirect to `/auth` but folders still exist under `src/app/login`, `src/app/register`

Dead route folders (redirect handled in `next.config.mjs`).

### L-18 — `usePaginationUrlState` hook unused; shop uses `usePagination` + `useShopFiltersUrl`

Dead hook.

---

## Findings by Category

### Runtime errors & crashes

| ID | Severity | Summary |
|----|----------|---------|
| C-01 | Critical | Payment callback unhandled 500 |
| C-02 | Critical | Pending moderation data leak |
| H-08 | High | Preferences sync unhandled rejection |
| M-01 | Medium | Product sales sync JSON parse |
| M-02 | Medium | Promo validate fetch |
| M-03 | Medium | Gift card purchase network errors |
| M-21 | Medium | Cart add prefetch |

### Unhandled exceptions

| ID | Severity | Summary |
|----|----------|---------|
| C-01 | Critical | Zarinpal callback early path |
| H-08 | High | useUserPreferencesSync |
| M-01–M-03 | Medium | Multiple hooks |
| L-07 | Low | parseJsonResponse on HTML errors |

### Missing error handling

| ID | Severity | Summary |
|----|----------|---------|
| H-01 | High | Gift-card Zarinpal rollback |
| H-11 | High | Customize infinite skeleton |
| M-15 | Medium | createOrderFromCart 500 mapping |
| M-19 | Medium | Home/catalog silent failures |
| M-20 | Medium | Returns/quotes hooks |
| L-02 | Low | Admin settings load |

### Missing loading states

| ID | Severity | Summary |
|----|----------|---------|
| M-09 | Medium | AuthGuard blank screen |
| M-17 | Medium | Account profile section |
| M-19 | Medium | Home/catalog hooks |

### Missing empty states

| ID | Severity | Summary |
|----|----------|---------|
| H-11 | High | Customize page failure |
| M-17 | Medium | Account profile fallthrough |
| L-02 | Low | Admin settings |

### Broken navigation

| ID | Severity | Summary |
|----|----------|---------|
| H-04 | High | useAuthPage early redirect |
| M-11 | Medium | Locale prefix ignored in guards |
| M-12 | Medium | i18n routes not implemented |
| L-17 | Low | Dead login/register folders |

### Race conditions

| ID | Severity | Summary |
|----|----------|---------|
| H-02 | High | Preference sync vs persist |
| H-05 | High | loadSession no abort |
| H-06 | High | Dual auth fetch |
| H-07 | High | Payment return side effects |
| M-04–M-06 | Medium | Fetch hooks, customize |
| M-18 | Medium | Account hash flash |

### State management issues

| ID | Severity | Summary |
|----|----------|---------|
| H-02 | High | Login overwrite race |
| H-06 | High | setAuthUser from two sources |
| M-07 | Medium | Redux hydration flash |
| M-22 | Medium | Auth persist prefix mismatch |

### Hydration issues

| ID | Severity | Summary |
|----|----------|---------|
| H-03 | High | CheckoutShippingForm sessionStorage |
| M-07 | Medium | Cart badge flash |
| M-08 | Medium | RtlSwiper document.dir |
| M-18 | Medium | Account section flash |

### Async issues

| ID | Severity | Summary |
|----|----------|---------|
| H-07 | High | Cart payment return |
| H-10 | High | register() no session sync |
| M-10 | Medium | useSearchParams Suspense |
| M-16 | Medium | Fire-and-forget notifyOrderPlaced |

### Null / undefined access risks

| ID | Severity | Summary |
|----|----------|---------|
| M-15 | Medium | createOrderFromCart throws |
| L-07 | Low | JSON parse assumptions |

No widespread `as any`, `@ts-ignore`, or non-null assertion abuse (`!.`) was found in `src/`.

---

## Dead Code Inventory

### Unused components (confirmed zero imports outside self/chain)

| Component | Path | Classification |
|-----------|------|----------------|
| `OrnamentalDivider` | `src/components/ui/OrnamentalDivider.tsx` | Dead |
| `Modal` | `src/components/ui/Modal.tsx` | Dead |
| `Card` | `src/components/ui/Card.tsx` | Dead |
| `Slider` | `src/components/ui/Slider.tsx` | Transitively dead |
| `OptionSelector` | `src/components/ui/OptionSelector.tsx` | Transitively dead |
| `CustomizerWizard` | `src/components/customizer/CustomizerWizard.tsx` | Dead (~550 lines) |
| `CustomizerPanel` | `src/components/customizer/CustomizerPanel.tsx` | Dead |
| `CompatibilityNotice` | `src/components/customizer/CompatibilityNotice.tsx` | Dead |
| `RingPreview` | `src/components/customizer/RingPreview.tsx` | Dead |
| `Ring3DPreview` | `src/components/customizer/Ring3DPreview.tsx` | Dead |
| `RingCanvas`, `RingModel`, `band-mesh` | `src/components/customizer/ring3d/*` | Transitively dead |
| `ChoiceGallery`, `ToggleChoice`, `WizardTimeline` | `src/components/customizer/wizard/*` | Transitively dead |
| `Ring360Preview` | `src/components/product/Ring360Preview.tsx` | Dead |
| `ProductOptions` | `src/components/product/ProductOptions.tsx` | Dead |
| `HomePromoStrip` | `src/components/sections/HomePromoStrip.tsx` | Dead |
| `SiteWideBanner` | `src/components/shop/SiteWideBanner.tsx` | Dead |
| `ShopAvailabilityLegend` | `src/components/shop/ShopAvailabilityLegend.tsx` | Dead |
| `ShopCollectionHeader` | `src/components/shop/ShopCollectionHeader.tsx` | Dead |
| `SiteContainer` | `src/components/layout/SiteContainer.tsx` | Dead |
| `SearchableSelectBox` | `src/components/inputs/SearchableSelectBox.tsx` | Unused export |

### Legacy `dashboard/` duplicates (zero imports)

| File | Active replacement |
|------|-------------------|
| `src/components/dashboard/OrderHistory.tsx` | `src/components/account/OrderHistory.tsx` |
| `src/components/dashboard/QuoteRequestHistory.tsx` | `src/components/account/QuoteRequestHistory.tsx` |
| `src/components/dashboard/CommentModeration.tsx` | `src/components/moderation/CommentModeration.tsx` |
| `src/components/dashboard/UgcModeration.tsx` | `src/components/moderation/UgcModeration.tsx` |
| `src/components/dashboard/ProductQuestionsModeration.tsx` | `src/components/moderation/ProductQuestionsModeration.tsx` |

### Unused hooks

| Hook | Path |
|------|------|
| `useCustomizer` | `src/lib/hooks/useCustomizer.ts` |
| `useCustomizerCompatibility` | `src/lib/hooks/useCustomizerCompatibility.ts` |
| `usePaginationUrlState` | `src/lib/hooks/usePaginationUrlState.ts` |
| `useCartSanitize` | `src/lib/hooks/useCartSanitize.ts` (implemented, not mounted) |

### Unused utilities

| Module | Path |
|--------|------|
| `trade-in-storage` | `src/lib/trade-in-storage.ts` |
| `listings` (runtime) | `src/lib/products/listings.ts` (seed-only) |

**Estimated dead surface:** ~2,000+ lines across customizer wizard chain, dashboard copies, and orphan UI.

---

## Duplicate Code Patterns

| Pattern | Locations | Notes |
|---------|-----------|-------|
| Abandoned customizer wizard vs live customize page | `CustomizerWizard/*` vs `src/app/customize/page.tsx` | Live flow uses inline `Stepper` + `ImageChoiceGrid` |
| Dual sales display on product page | `ProductSalesCount` + `ProductSalesStat` in `ProductPageClient.tsx` | Same Redux selector |
| Triple promo banner UI | `HeaderPromoStrip`, `HomePromoStrip`, `SiteWideBanner` | Only header strip is wired |
| Dashboard vs account/moderation panels | `components/dashboard/*` vs `account/*`, `moderation/*` | Verbatim legacy copies |
| Shop filter split | `shop-filter-utils.ts` vs `shop/shop-filter-url.ts` | Overlapping responsibilities |
| Auth session sync called twice on OTP | `useAuth.verifyOtp` + `auth/page.tsx` | Redundant `syncSessionAfterLogin` |

---

## Positive Observations

- **80/80 unit tests pass** covering pricing, promo, auth session JWT, cart sanitization, order creation.
- **Consistent API error handling** via `handleRouteError` on most routes.
- **Admin role guards** (`ensureAdmin`, middleware) on `/api/admin/*`.
- **Cron endpoints** protected by `x-cron-secret`.
- **Server-authoritative pricing** — client totals discarded at checkout.
- **Good empty states** on shop, cart, and most admin list panels (`UnifiedEmptyState`, `admin-*-empty`).
- **AbortController** used in `usePersistUserPreferences` and `useProductSearch`.
- **`useAuth.loadSession`** retries transient network errors before clearing session.
- **No `"use server"` / Server Actions** — simpler mutation surface (API-only).

---

## Recommended Fix Priority

### P0 — Fix before next production deploy

1. **C-01** — Wrap entire Zarinpal callback in try/catch; ensure paid users always get redirect.
2. **C-02** — Restrict `status` on comments/questions GET to `approved` unless admin.
3. **H-01** — Add Zarinpal-failure rollback to gift-card purchase (mirror main checkout).
4. **H-02** — Gate `usePersistUserPreferences` until `designsRemoteMerged` + preferences sync complete (or bump debounce).

### P1 — Next sprint

5. **H-03** — Move `sessionStorage` read to `useEffect` in `CheckoutShippingForm`.
6. **H-04 / H-05 / H-06** — Unify auth hydration; add abort to `loadSession`; single source for `setAuthUser`.
7. **H-07** — Sequence payment-return side effects in `CartPageContent`.
8. **H-09** — Wire `useCartSanitize` in `AppContext` + add try/catch.
9. **H-11** — Add error empty state on customize page.
10. **H-12** — Rate-limit analytics/A/B ingest endpoints.

### P2 — Tech debt / cleanup

11. Remove dead customizer wizard chain + dashboard duplicates.
12. Consolidate product sales UI components.
13. Add `Suspense` to account/customize/guide pages.
14. Complete i18n route tree or remove locale prefix handling.
15. Add error states to data hooks (`useHomeData`, `useCatalogProducts`, etc.).

---

## Appendix: Test & Lint Results

```
npm run test  → 19 files, 80 tests passed
npm run lint  → 0 errors, 1 warning (AdminAuditLogPanel useEffect deps)
```

---

*End of runtime audit. No code was modified during this analysis.*
