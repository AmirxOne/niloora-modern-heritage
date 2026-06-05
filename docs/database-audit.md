# Niloora — Database & Business Logic Audit

**Generated:** 2026-06-06  
**Role:** Senior Backend Engineer (read-only analysis)  
**Scope:** Products, categories (collections), inventory, orders, payments, users, reviews, coupons, discounts, wishlist, cart  
**Stack:** PostgreSQL · Prisma 7 · Next.js 14 API routes  
**Related audits:** [project-audit.md](./project-audit.md) · [runtime-audit.md](./runtime-audit.md) · [security-audit.md](./security-audit.md)

---

## Executive Summary

Niloora uses a single PostgreSQL database with Prisma as the ORM. Checkout pricing is **server-authoritative** (`repriceOrderItems`), and direct order creation via `POST /api/orders` is disabled. Payment success is handled in a transactional callback for Zarinpal flows.

The most serious gaps are in **inventory lifecycle** and **post-payment consistency**:

| Severity | Count |
|----------|-------|
| **Critical** | 4 |
| **High** | 11 |
| **Medium** | 16 |
| **Low** | 10 |
| **Total** | 41 |

**Top risks:**

1. **No inventory mutation on paid orders** — stock and `availability` are validated at checkout but never decremented or marked sold after payment.
2. **BNPL path skips payment and fulfillment side effects** — orders move to `processing` without `Payment`, gift-card consumption, loyalty, or referral rewards.
3. **Gift-card over-commitment** — balance is checked at order creation but not reserved; concurrent checkouts can over-apply the same card; failed consumption is silently ignored at callback.
4. **Time-of-check vs time-of-use race** — two buyers can pass stock validation and both pay for single-quantity jewelry.

---

## Table of Contents

1. [Domain Model Map](#1-domain-model-map)
2. [Order & Payment Flow](#2-order--payment-flow)
3. [Inventory Lifecycle Gap](#3-inventory-lifecycle-gap)
4. [Critical Findings](#4-critical-findings)
5. [High Findings](#5-high-findings)
6. [Medium Findings](#6-medium-findings)
7. [Low Findings](#7-low-findings)
8. [Findings by Domain](#8-findings-by-domain)
9. [Verification Matrix](#9-verification-matrix)
10. [Positive Patterns](#10-positive-patterns)
11. [Remediation Priority](#11-remediation-priority)

---

## 1. Domain Model Map

| Business concept | Prisma model(s) | Primary write paths |
|----------------|-----------------|---------------------|
| **Products** | `Product`, `ProductImage`, `ProductListing`, `PreOwnedInfo` | Admin CRUD (`admin-product-service.ts`), CSV import |
| **Categories** | `Collection` (relational) + `Product.category` (denormalized string) | Admin collections; product payload sets both |
| **Inventory** | `Product.stock`, `Product.availability` (string) | Admin only — **not updated by orders** |
| **Cart** | `UserPreference.cartItems` (JSON) + client Redux | `PUT /api/user/preferences`, `sanitizeCartItems` |
| **Wishlist** | `UserPreference.wishlistIds`, `wishlistPriceWatch` (JSON) | `PUT /api/user/preferences` |
| **Orders** | `Order`, `OrderItem` | `createOrderFromCart` via `POST /api/payments/zarinpal/request` |
| **Payments** | `Payment`, `PaymentLog` | Zarinpal request + callback; BNPL creates **no** `Payment` row |
| **Coupons** | `PromoCode` | Admin CRUD; validated at checkout, **no usage ledger** |
| **Discounts** | `DiscountCampaign`, `DiscountCampaignUsage` | Campaign rules at checkout; usage recorded per order |
| **Users** | `User`, `Session`, `UserPreference` | OTP auth, `resolveCheckoutUser` for guest checkout |
| **Reviews** | `ProductComment`, `ProductQuestion`, `ProductQuestionAnswer` | `POST /api/comments`; moderation via `status` string |
| **Gift cards** | `GiftCard`, `GiftCardTransaction` | Purchase flow + `consumeGiftCardForOrder` on Zarinpal success |

---

## 2. Order & Payment Flow

```mermaid
sequenceDiagram
  participant Client
  participant Request as POST /api/payments/zarinpal/request
  participant Pricing as repriceOrderItems
  participant Stock as validateCartPurchase
  participant Create as createOrderFromCart
  participant ZP as Zarinpal
  participant Callback as GET /api/payments/zarinpal/callback
  participant DB as PostgreSQL

  Client->>Request: items, shipping, promo, gift card
  Request->>Pricing: reprice (ignore client prices)
  Pricing->>Stock: read stock/availability (no lock)
  Stock-->>Pricing: pass / CartPurchaseError
  Pricing-->>Create: priced lines
  Create->>DB: INSERT Order + OrderItems (pending_payment)
  Create->>DB: recordCampaignUsage (separate op)
  alt Zarinpal
    Request->>DB: INSERT Payment (pending)
    Request->>ZP: request authority
    ZP-->>Client: redirect
    Client->>Callback: Authority + Status=OK
    Callback->>ZP: verify
    Callback->>DB: $transaction: payment=paid, order=processing
    Note over Callback,DB: gift card, loyalty, referral — no stock update
  else BNPL
    Request->>DB: order.status = processing
    Note over Request,DB: No Payment, no gift card consume, no loyalty
  end
```

**Authoritative entry point:** `POST /api/orders` returns `400` — orders are only created through the payment request path.

```26:33:src/app/api/orders/route.ts
/**
 * ثبت مستقیم سفارش غیرفعال است — قیمت‌ها فقط سمت سرور در
 * `repriceOrderItems` (مسیر `POST /api/payments/zarinpal/request` → `createOrderFromCart`) محاسبه می‌شوند.
 */
export async function POST() {
  return badRequest(
    "ثبت سفارش فقط پس از پاداخت موفق از درگاه انجام می‌شود. از /api/payments/zarinpal/request استفاده کنید؛ قیمت سبد در کلاینت معتبر نیست."
  );
}
```

---

## 3. Inventory Lifecycle Gap

**Expected e-commerce flow:** validate → reserve (optional) → commit on payment → restore on cancel/return.

**Actual flow:**

| Stage | Stock read? | Stock write? | Availability update? |
|-------|-------------|--------------|----------------------|
| Add to cart (client) | Via `validateAddToCart` API | No | No |
| Sanitize cart | `sanitizeCartItems` reads DB | No | No |
| Checkout reprice | `validateCartPurchase` | No | No |
| Order created (`pending_payment`) | — | No | No |
| Payment success | — | **No** | **No** |
| Admin status change | — | No | No |
| Order return approved | — | No | No |

Stock mutations occur **only** in admin product services (`admin-product-service.ts`, bulk/CSV routes). A repository-wide search for `product.update` outside admin paths finds **no checkout or payment inventory updates**.

For a gallery selling unique pieces (`stock` default `1`, `availability` includes `"sold"`), this is a **data-integrity defect**: the database can show items as available while multiple paid orders reference the same `productId`.

---

## 4. Critical Findings

### DB-C01 — Paid orders never decrement stock or mark products sold

| Field | Detail |
|-------|--------|
| **Domain** | Inventory, Orders |
| **Files** | `src/app/api/payments/zarinpal/callback/route.ts`, `src/lib/server/orders/create-order.ts` |
| **Constraint gap** | No trigger, no service hook, no `stock` CHECK tied to `OrderItem` |

**Issue:** `validateCartPurchase` runs at reprice time. After Zarinpal verification, the callback transaction updates `Payment` and `Order`, consumes gift cards, and runs loyalty/referral — but **never** updates `Product.stock` or `Product.availability`.

**Impact:** Overselling of one-of-a-kind inventory; catalog remains purchasable after sale; `sanitizeCart` and new checkouts may succeed until an admin manually updates the product.

**Evidence:** Payment success transaction (`callback/route.ts` lines 113–155) has no `product.update` or inventory service call.

---

### DB-C02 — BNPL checkout bypasses payment record and post-payment side effects

| Field | Detail |
|-------|--------|
| **Domain** | Payments, Orders, Loyalty, Gift cards |
| **Files** | `src/app/api/payments/zarinpal/request/route.ts` (lines 94–157) |

**Issue:** When `paymentMethod === "bnpl"`, the handler sets `order.status` to `processing` and returns immediately. It does **not**:

- Create a `Payment` row
- Call `consumeGiftCardForOrder`
- Call `rewardLoyaltyOnPaidOrder` or `rewardReferralOnPaidOrder`
- Call `scheduleOrderMaintenanceReminders`
- Decrement inventory

**Impact:** BNPL orders appear fulfilled in the system without financial settlement tracking; gift-card discounts recorded on the order are never debited; loyalty/referral economics are wrong.

---

### DB-C03 — Gift-card balance can be over-committed across concurrent orders

| Field | Detail |
|-------|--------|
| **Domain** | Payments, Orders |
| **Files** | `src/lib/server/gift-card/gift-card-service.ts`, `src/lib/server/orders/create-order.ts` |

**Issue:** `validateGiftCardForCheckout` reads `remainingAmount` at order creation. No reservation row or pessimistic lock exists. Two concurrent `pending_payment` orders can each store the full `giftCardAppliedAmount` against the same card.

At callback, `consumeGiftCardForOrder` applies `min(remaining, amount)` and **returns `null` if insufficient** — the callback does not check the return value or fail the order.

**Impact:** Customer pays reduced gateway amount (gift card credited on order) but card is not fully debited; revenue leakage and reconciliation errors.

---

### DB-C04 — Stock validation race (time-of-check ≠ time-of-use)

| Field | Detail |
|-------|--------|
| **Domain** | Inventory, Orders |
| **Files** | `src/lib/server/products/validate-cart-purchase.ts`, `src/app/api/payments/zarinpal/callback/route.ts` |

**Issue:** Stock is checked when `repriceOrderItems` runs (payment request). Between that moment and Zarinpal callback (minutes) or between two simultaneous requests (milliseconds), no row-level lock or reservation prevents duplicate purchase of `stock: 1` items.

**Impact:** Two users can receive `processing` orders for the same physical piece; combined with DB-C01, both orders remain valid in the database.

---

## 5. High Findings

### DB-H01 — Order creation and campaign usage are not atomic

| Field | Detail |
|-------|--------|
| **Domain** | Orders, Discounts |
| **Files** | `src/lib/server/orders/create-order.ts` (lines 67–123) |

**Issue:** `prisma.order.create` and `recordCampaignUsage` run as separate operations. If usage recording fails after order insert, the order exists with `campaignDiscountAmount` but no `DiscountCampaignUsage` row.

**Mitigation present:** `DiscountCampaignUsage` has `@@unique([orderId, campaignId])` and upsert logic — retries are idempotent per order.

---

### DB-H02 — Gift-card purchase leaves orphan orders on Zarinpal failure

| Field | Detail |
|-------|--------|
| **Domain** | Payments, Orders |
| **Files** | `src/app/api/gift-cards/purchase/route.ts` |

**Issue:** Unlike main checkout (`request/route.ts` lines 237–249), gift-card purchase has no `try/catch` rollback to `payment_failed` when `zarinpalRequestPayment` throws. Order and pending `Payment` rows remain orphaned.

**Cross-ref:** Runtime audit **C-02 / H-04** (orphaned payment orders).

---

### DB-H03 — Promo codes have no usage limits or redemption ledger

| Field | Detail |
|-------|--------|
| **Domain** | Coupons |
| **Files** | `prisma/schema.prisma` (`PromoCode`), `src/lib/server/promo/promo-code-service.ts` |

**Issue:** `PromoCode` stores rules (`type`, `value`, `minSubtotal`, `active`) but no `maxUses`, `maxUsesPerUser`, or `PromoCodeUsage` table. The same code can be applied on unlimited orders.

**Impact:** Marketing abuse; inability to enforce single-use or per-customer caps at the database layer.

---

### DB-H04 — Payment callback ignores gift-card consumption failure

| Field | Detail |
|-------|--------|
| **Domain** | Payments |
| **Files** | `src/app/api/payments/zarinpal/callback/route.ts` (lines 133–140) |

**Issue:** `consumeGiftCardForOrder` return value is not checked. Order still transitions to `processing` when consumption returns `null`.

---

### DB-H05 — Loyalty rewards lack order-level idempotency guard

| Field | Detail |
|-------|--------|
| **Domain** | Users, Orders |
| **Files** | `src/lib/server/loyalty/loyalty.ts` (`rewardLoyaltyOnPaidOrder`) |

**Issue:** Rewards increment `loyaltyPoints` and `loyaltyLifetimeSpend` when `order.status === "processing"`. Idempotency relies on `payment.status === "paid"` short-circuit (line 94 of callback) before verify. Concurrent duplicate callbacks that both pass verify before either commits could double-award points.

**Contrast:** Referral uses `updateMany` with `rewardedAt: null` guard — stronger pattern.

---

### DB-H06 — Payment status transition is not conditional

| Field | Detail |
|-------|--------|
| **Domain** | Payments |
| **Files** | `src/app/api/payments/zarinpal/callback/route.ts` |

**Issue:** `tx.payment.update` sets `status: "paid"` without `where: { status: "pending" }`. A duplicate concurrent handler could theoretically run post-payment side effects twice if both pass the early `payment.status === "paid"` check before either commits.

---

### DB-H07 — `createOrderId` is not collision-safe under concurrency

| Field | Detail |
|-------|--------|
| **Domain** | Orders |
| **Files** | `src/lib/server/orders/create-order.ts` (lines 16–18) |

**Issue:** IDs use `HS-` + last 8 chars of `Date.now().toString(36)`. Same-millisecond requests can collide; `order.create` would throw on PK violation with no retry.

---

### DB-H08 — User preference sync is last-write-wins (cart & wishlist)

| Field | Detail |
|-------|--------|
| **Domain** | Cart, Wishlist |
| **Files** | `src/app/api/user/preferences/route.ts`, `src/lib/server/preferences.ts` |

**Issue:** `PUT` reads current preferences then writes a full replacement without optimistic locking or merge semantics. Debounced client persist can overwrite server-merged cart after login.

**Cross-ref:** Runtime audit login preference race.

---

### DB-H09 — Customizer lines without `productId` skip stock validation

| Field | Detail |
|-------|--------|
| **Domain** | Cart, Inventory |
| **Files** | `src/lib/server/products/validate-cart-purchase.ts` (lines 20–22) |

**Issue:** `aggregateQuantityByProductId` ignores lines without `productId`. If `totals.size === 0`, validation returns immediately — bespoke customizer-only carts bypass inventory checks entirely.

---

### DB-H10 — BNPL orders treated as “paid” in timeline/referral logic

| Field | Detail |
|-------|--------|
| **Domain** | Orders, Referrals |
| **Files** | `src/lib/orders/order-timeline.ts`, `src/lib/server/referral/referral.ts` |

**Issue:** BNPL sets `processing` immediately, so referral rewards (if ever invoked) and customer-facing timelines behave as if payment completed, without gateway verification.

---

### DB-H11 — No automatic cleanup of stale `pending_payment` orders

| Field | Detail |
|-------|--------|
| **Domain** | Orders, Inventory |
| **Files** | Order schema; no cron/job |

**Issue:** Abandoned checkouts accumulate `pending_payment` rows. They do not reserve stock, but they inflate order metrics and complicate support unless manually purged.

---

## 6. Medium Findings

### DB-M01 — Returns do not restore product stock or availability

| Field | Detail |
|-------|--------|
| **Domain** | Inventory, Orders |
| **Files** | `src/lib/server/returns/order-return-service.ts` |

**Issue:** Return workflow validates quantities and updates return status but never increments `Product.stock` or reverts `availability` from `sold`.

---

### DB-M02 — Admin order status changes do not couple to inventory

| Field | Detail |
|-------|--------|
| **Domain** | Orders, Inventory |
| **Files** | `src/app/api/admin/orders/[id]/route.ts` |

**Issue:** Admin can set `processing` → `delivered` (or any allowed status) with no inventory side effects. Cancelling a paid order does not restock.

---

### DB-M03 — Duplicate reviews allowed per user per product

| Field | Detail |
|-------|--------|
| **Domain** | Reviews |
| **Files** | `prisma/schema.prisma` (`ProductComment`), `src/app/api/comments/route.ts` |

**Issue:** No `@@unique([productId, userId])`. Authenticated users can submit unlimited comments per product (all `pending` until moderated).

---

### DB-M04 — `ProductComment.userId` optional with no FK enforcement on guest path

| Field | Detail |
|-------|--------|
| **Domain** | Reviews |
| **Files** | `ProductComment` model |

**Issue:** `userId` is nullable (`onDelete: SetNull`). POST route always sets `userId` for authenticated users — consistent today, but schema allows orphan comments if other writers are added.

---

### DB-M05 — Client-side sales counter is not authoritative

| Field | Detail |
|-------|--------|
| **Domain** | Products |
| **Files** | `src/lib/hooks/useOrders.ts` (`completePaidOrder` → `incrementProductSalesFromItems`) |

**Issue:** Redux `productSalesSlice` increments on client after payment redirect. Not persisted to `Product.initialSalesCount` or a sales ledger — analytics and UI can disagree with DB.

---

### DB-M06 — `OrderItem` snapshots catalog state without DB link enforcement

| Field | Detail |
|-------|--------|
| **Domain** | Orders, Products |
| **Files** | `OrderItem` model |

**Issue:** `productId` is optional (`onDelete: SetNull`). Name, price, image, `availability` are denormalized at order time — correct for invoices, but deleting a product nullifies FK while line still references id in JSON fields.

---

### DB-M07 — `referralCredit` is accrued but not applied at checkout

| Field | Detail |
|-------|--------|
| **Domain** | Users, Orders |
| **Files** | `User.referralCredit`, `repriceOrderItems` |

**Issue:** Referral credits increment on first paid order but are never subtracted during `repriceOrderItems`. Display-only balance — not a corruption bug, but business logic gap.

---

### DB-M08 — Campaign FK on order uses `onDelete: SetNull`

| Field | Detail |
|-------|--------|
| **Domain** | Discounts |
| **Files** | `Order.campaignId` → `DiscountCampaign` |

**Issue:** Deleting a campaign nullifies `Order.campaignId` while `campaignDiscountAmount` remains — historical reporting still has amount, but join to campaign metadata is lost.

---

### DB-M09 — `availability` and `status` are unconstrained strings

| Field | Detail |
|-------|--------|
| **Domain** | Products, Orders |
| **Files** | `prisma/schema.prisma` |

**Issue:** No Prisma enum or CHECK constraints. Typos (`"Sold"` vs `"sold"`) bypass `getPurchaseBlockReason` logic which checks exact `"sold"`.

---

### DB-M10 — `Product.stock` has no non-negative DB constraint

| Field | Detail |
|-------|--------|
| **Domain** | Inventory |
| **Files** | `Product` model |

**Issue:** Admin or future automation could persist negative stock; application checks `stock <= 0` but DB does not enforce `stock >= 0`.

---

### DB-M11 — Cart JSON in `UserPreference` has no schema validation at DB layer

| Field | Detail |
|-------|--------|
| **Domain** | Cart |
| **Files** | `UserPreference.cartItems` (`Json?`) |

**Issue:** Malformed JSON shapes are only normalized at API boundary. Direct DB edits could break client hydration.

---

### DB-M12 — Wishlist stores product IDs without existence FK

| Field | Detail |
|-------|--------|
| **Domain** | Wishlist |
| **Files** | `UserPreference.wishlistIds` |

**Issue:** Stale IDs accumulate until client prunes; no junction table or `onDelete: Cascade` from `Product`.

---

### DB-M13 — `resolvePromoByCode` scans all active promos

| Field | Detail |
|-------|--------|
| **Domain** | Coupons |
| **Files** | `src/lib/server/promo/promo-code-service.ts` |

**Issue:** Loads every active `PromoCode` to match aliases — consistency risk under high promo count (stale reads), not incorrect single-code logic.

---

### DB-M14 — Order pricing reads product catalog without `stock` in pricing query

| Field | Detail |
|-------|--------|
| **Domain** | Products, Orders |
| **Files** | `src/lib/server/order-pricing.ts` (lines 70–84) |

**Issue:** Stock validated separately in `validateCartPurchase`, then products re-fetched without `stock` for pricing — correct if validation is trustworthy, fragile if validation is skipped (DB-H09) or raced (DB-C04).

---

### DB-M15 — Guest checkout user provisioning outside order transaction

| Field | Detail |
|-------|--------|
| **Domain** | Users, Orders |
| **Files** | `src/app/api/payments/zarinpal/request/route.ts`, `resolveCheckoutUser` |

**Issue:** User may be created/linked before order; failure after user creation leaves user without order — acceptable orphan user, not order corruption.

---

### DB-M16 — `DiscountCampaignUsage` records discount but campaigns have no global cap

| Field | Detail |
|-------|--------|
| **Domain** | Discounts |
| **Files** | `DiscountCampaign`, `recordCampaignUsage` |

**Issue:** Usage is tracked per order for analytics, but no `maxTotalDiscount` or `maxRedemptions` field prevents unlimited campaign spend.

---

## 7. Low Findings

### DB-L01 — `Product.category` string duplicates `Collection` relationship

Categories exist both as `Collection` FK and free-text `Product.category` — drift risk if admin updates one field only.

### DB-L02 — `Payment.orderId` is `@unique` — one payment per order (good) but prevents partial/multi-capture models

By design for Zarinpal; document if split payments are ever needed.

### DB-L03 — `GiftCard.orderId` `@unique` on purchased cards ties one card to one originating order — correct for issuance idempotency

### DB-L04 — `OrderNotification` `@@unique([orderId, kind, channel])` — good duplicate prevention for notifications

### DB-L05 — `BackInStockAlert` `@@unique([productId, channel, contact])` — good duplicate prevention

### DB-L06 — `OrderReturnItem` `@@unique([returnId, orderItemId])` — prevents duplicate line returns

### DB-L07 — `GiftCardTransaction` `@@unique([orderId, type])` — prevents double redeem record per order

### DB-L08 — Pending moderation comments excluded from public lists by query filter, not DB view

Consistency depends on every read path filtering `status = approved`.

### DB-L09 — `createOrderFromCart` throws generic `Error` for invalid payable vs `CartPurchaseError` for stock

Callers must handle multiple error types.

### DB-L10 — Timestamp-based order IDs are human-readable but not lexicographically sortable by creation order across bases

Use `createdAt` for sorting (already indexed).

---

## 8. Findings by Domain

### Products

| ID | Severity | Topic |
|----|----------|-------|
| DB-C01 | Critical | No post-sale stock/availability update |
| DB-M05 | Medium | Client-only sales counter |
| DB-M09 | Medium | Unconstrained `availability` string |
| DB-M10 | Medium | No `stock >= 0` constraint |
| DB-L01 | Low | `category` vs `Collection` duplication |

### Categories (Collections)

| ID | Severity | Topic |
|----|----------|-------|
| DB-L01 | Low | Denormalized `Product.category` can drift from `Collection` |

Admin `assertCollectionExists` validates FK on write — good.

### Inventory

| ID | Severity | Topic |
|----|----------|-------|
| DB-C01 | Critical | No decrement on payment |
| DB-C04 | Critical | Validation race |
| DB-M01 | Medium | Returns don't restock |
| DB-M02 | Medium | Admin status ignores inventory |
| DB-H09 | High | Customizer lines skip validation |
| DB-M10 | Medium | Negative stock possible at DB level |

### Orders

| ID | Severity | Topic |
|----|----------|-------|
| DB-H01 | High | Non-atomic campaign usage |
| DB-H07 | High | Order ID collision risk |
| DB-H11 | High | Stale `pending_payment` accumulation |
| DB-M06 | Medium | Denormalized line items |
| DB-M09 | Medium | Unconstrained `status` string |

### Payments

| ID | Severity | Topic |
|----|----------|-------|
| DB-C02 | Critical | BNPL skips `Payment` |
| DB-C03 | Critical | Gift-card over-commit |
| DB-H02 | High | Gift-card purchase orphan orders |
| DB-H04 | High | Ignored gift-card consume failure |
| DB-H05 | High | Loyalty double-award risk |
| DB-H06 | High | Non-conditional paid transition |

### Users

| ID | Severity | Topic |
|----|----------|-------|
| DB-H05 | High | Loyalty idempotency |
| DB-M07 | Medium | `referralCredit` not spendable |
| DB-M15 | Medium | Guest user created outside order tx |

`User.phone`, `User.email`, `User.referralCode` have `@unique` — good duplicate prevention.

### Reviews (Comments / Questions)

| ID | Severity | Topic |
|----|----------|-------|
| DB-M03 | Medium | No one-review-per-user constraint |
| DB-M04 | Medium | Nullable `userId` on comments |
| DB-L08 | Low | Moderation enforced in queries only |

Verified-buyer flag is computed at insert from `orderItem` existence — good snapshot logic.

### Coupons (Promo codes)

| ID | Severity | Topic |
|----|----------|-------|
| DB-H03 | High | No usage limits/ledger |
| DB-M13 | Medium | Full-table scan for resolution |

### Discounts (Campaigns)

| ID | Severity | Topic |
|----|----------|-------|
| DB-H01 | High | Usage recording outside order tx |
| DB-M08 | Medium | `SetNull` on campaign delete |
| DB-M16 | Medium | No global redemption cap |

`@@unique([orderId, campaignId])` on usage — good per-order idempotency.

### Wishlist

| ID | Severity | Topic |
|----|----------|-------|
| DB-H08 | High | Last-write-wins sync |
| DB-M12 | Medium | No FK to products |

### Cart

| ID | Severity | Topic |
|----|----------|-------|
| DB-H08 | High | Last-write-wins sync |
| DB-M11 | Medium | JSON without DB schema |
| DB-H09 | High | Stock bypass for customizer-only lines |

Server `sanitizeCartItems` correctly refreshes prices and removes unpurchasable lines on read paths.

---

## 9. Verification Matrix

| Check | Status | Notes |
|-------|--------|-------|
| **Data consistency** | ⚠️ Partial | Order line snapshots good; inventory vs orders inconsistent |
| **Transaction safety** | ⚠️ Partial | Payment callback uses `$transaction`; order create + campaign usage split |
| **Inventory accuracy** | ❌ Fail | Read-only at checkout; no write on sale |
| **Order integrity** | ✅ Mostly | Server pricing; direct POST disabled; items created with order |
| **Cascade operations** | ✅ Mostly | Sensible `onDelete` on core models; campaign `SetNull` on orders |
| **Foreign key logic** | ✅ Mostly | Prisma relations enforced; cart/wishlist JSON exempt |
| **Duplicate prevention** | ⚠️ Partial | Strong on payments/gift txs/returns; weak on promos/reviews |

---

## 10. Positive Patterns

1. **Server-authoritative pricing** — Client cart prices ignored; `repriceOrderItems` rebuilds from DB catalog, bundles, campaigns, promo, loyalty (`order-pricing.ts`).

2. **Stock validation before order persist** — `validateCartPurchase` aggregates quantities per `productId` and uses `getPurchaseBlockReason` (`purchasability.ts`).

3. **Payment callback idempotency (basic)** — Early return when `payment.status === "paid"` avoids re-verification (`callback/route.ts` line 94).

4. **Gift-card redeem idempotency per order** — `GiftCardTransaction` `@@unique([orderId, type])` prevents duplicate redeem rows for the same order.

5. **Referral reward concurrency guard** — `updateMany` with `rewardedAt: null` before incrementing credits (`referral.ts`).

6. **Campaign usage upsert** — `recordCampaignUsage` uses `orderId_campaignId` unique key.

7. **Order–payment 1:1** — `Payment.orderId @unique` ensures single gateway session per order.

8. **User uniqueness** — Phone, email, referral code enforced at DB level.

9. **Return line uniqueness** — `@@unique([returnId, orderItemId])` prevents double-return of same line.

10. **Admin product writes in transactions** — `createAdminProduct` / updates use `$transaction` for related ring config rows.

---

## 11. Remediation Priority

### P0 — Before high-traffic sales

| Priority | Action | Addresses |
|----------|--------|-----------|
| 1 | **Commit inventory in payment success tx** — decrement `stock`, set `availability: "sold"` when `stock` reaches 0; optional row lock `SELECT FOR UPDATE` on products during checkout | DB-C01, DB-C04 |
| 2 | **Unify BNPL with post-payment pipeline** — create `Payment` or equivalent settlement record; run gift card, loyalty, referral, inventory in shared function | DB-C02, DB-H10 |
| 3 | **Reserve or re-validate stock at callback** — fail payment success if stock insufficient; or soft-reserve at order create with TTL | DB-C04 |
| 4 | **Gift-card reservation or atomic debit** — hold balance at order create, or fail callback when `consumeGiftCardForOrder` returns null | DB-C03, DB-H04 |

### P1 — Short term

| Priority | Action | Addresses |
|----------|--------|-----------|
| 5 | Wrap `order.create` + `recordCampaignUsage` in single `$transaction` | DB-H01 |
| 6 | Add `PromoCodeUsage` ledger + optional limits on `PromoCode` | DB-H03 |
| 7 | Gift-card purchase Zarinpal failure rollback (match main checkout) | DB-H02 |
| 8 | Conditional payment update `where: { status: "pending" }` + order-level `loyaltyAwardedAt` flag | DB-H05, DB-H06 |
| 9 | `createOrderId` → cuid/ulid or retry on PK conflict | DB-H07 |
| 10 | Preference sync with `updatedAt` optimistic concurrency | DB-H08 |

### P2 — Medium term

| Priority | Action | Addresses |
|----------|--------|-----------|
| 11 | Restock on return approval / cancel | DB-M01, DB-M02 |
| 12 | `@@unique([productId, userId])` on `ProductComment` (or per-order review) | DB-M03 |
| 13 | Prisma enums or CHECK for `availability` and `order.status` | DB-M09 |
| 14 | Cron to expire `pending_payment` orders after N hours | DB-H11 |
| 15 | Persist sales counts to DB on payment success | DB-M05 |

---

## Appendix A — Key File Index

| Area | Path |
|------|------|
| Order creation | `src/lib/server/orders/create-order.ts` |
| Pricing | `src/lib/server/order-pricing.ts` |
| Stock validation | `src/lib/server/products/validate-cart-purchase.ts`, `src/lib/products/purchasability.ts` |
| Payment request | `src/app/api/payments/zarinpal/request/route.ts` |
| Payment callback | `src/app/api/payments/zarinpal/callback/route.ts` |
| Gift cards | `src/lib/server/gift-card/gift-card-service.ts` |
| Campaigns | `src/lib/server/campaigns/discount-campaign-service.ts` |
| Promo codes | `src/lib/server/promo/promo-code-service.ts` |
| Cart sanitize | `src/lib/server/cart/sanitize-cart.ts` |
| Preferences | `src/app/api/user/preferences/route.ts`, `src/lib/server/preferences.ts` |
| Reviews | `src/app/api/comments/route.ts` |
| Schema | `prisma/schema.prisma` |

---

## Appendix B — Suggested Inventory Fix Shape (Reference Only)

Not implemented — documentation reference for engineers:

```sql
-- Illustrative: atomic stock decrement guarded by quantity
UPDATE "Product"
SET stock = stock - :qty,
    availability = CASE WHEN stock - :qty <= 0 THEN 'sold' ELSE availability END
WHERE id = :productId
  AND availability != 'sold'
  AND stock >= :qty;
```

This should run inside the existing payment success `prisma.$transaction` (or BNPL equivalent) with one update per distinct `productId` in the order, summing `OrderItem.quantity`.

---

*End of database audit. No application code was modified.*
