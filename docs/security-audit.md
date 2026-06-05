# Niloora — Application Security Audit Report

**Generated:** 2026-06-06  
**Role:** Senior Application Security Engineer (read-only analysis)  
**Scope:** Authentication, authorization, API surface, data layer, cookies/sessions, secrets, OWASP-class vulnerabilities  
**Related audits:** `docs/project-audit.md`, `docs/runtime-audit.md`

---

## Executive Summary

Niloora implements a **defense-in-depth** pattern for API authorization: HTTP-only session cookies, JWT access tokens bound to DB refresh sessions, and `readSessionUser()` + role guards on mutating endpoints. Prisma ORM eliminates most SQL injection risk, and OTP endpoints have layered rate limiting.

However, several **access-control gaps**, **weak token entropy**, and **missing rate limits** create exploitable paths in production:

| Severity | Count |
|----------|-------|
| **Critical** | 2 |
| **High** | 11 |
| **Medium** | 18 |
| **Low** | 12 |
| **Total** | 43 |

**Highest-priority issues:**

1. Public APIs leak **pending moderation content** via `?status=pending` (broken access control).
2. **Open redirect** on post-login `redirect` query parameter (phishing).
3. **Edge middleware trusts JWT role claims** without DB session validation (stale admin access to pages).
4. **Weak password-reset token** (32-bit) with **no brute-force rate limit** on reset endpoint.
5. **Password login** does not enforce `user.blocked` (blocked users can authenticate).

---

## Table of Contents

1. [Security Architecture Overview](#1-security-architecture-overview)
2. [Authentication Assessment](#2-authentication-assessment)
3. [Authorization Assessment](#3-authorization-assessment)
4. [Middleware Assessment](#4-middleware-assessment)
5. [Session & Cookie Assessment](#5-session--cookie-assessment)
6. [JWT Handling Assessment](#6-jwt-handling-assessment)
7. [API Route Security Matrix](#7-api-route-security-matrix)
8. [Database Access Assessment](#8-database-access-assessment)
9. [Environment Variables & Secrets](#9-environment-variables--secrets)
10. [Vulnerability Findings by Class](#10-vulnerability-findings-by-class)
11. [Critical Findings](#11-critical-findings)
12. [High Findings](#12-high-findings)
13. [Medium Findings](#13-medium-findings)
14. [Low Findings](#14-low-findings)
15. [Positive Security Controls](#15-positive-security-controls)
16. [Remediation Priority](#16-remediation-priority)

---

## 1. Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  apiFetch(credentials: "include") → session cookie auto-attached    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│  Edge Middleware (src/middleware.ts)                                  │
│  • JWT signature verify only (no DB session check)                    │
│  • Protects /account, /admin pages, /api/admin/*                      │
│  • Security headers (HSTS, X-Frame-Options, nosniff)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│  API Route Handlers                                                   │
│  • readSessionUser() — full validation (refresh hash + DB session)    │
│  • ensureAdmin() / ensureContentWorkflowAccess()                      │
│  • Prisma parameterized queries                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│  PostgreSQL + external providers (Zarinpal, Kavenegar, Resend)        │
└─────────────────────────────────────────────────────────────────────┘
```

**Trust boundaries:**

| Layer | Trust level | Notes |
|-------|-------------|-------|
| Client Redux `auth.user.role` | Untrusted | UI only; must not gate server actions |
| Edge JWT payload | Partially trusted | Signature valid; role may be stale |
| `readSessionUser()` | Trusted | DB session + refresh hash + blocked check |
| Prisma query `where: { userId }` | Trusted | IDOR prevention pattern |

---

## 2. Authentication Assessment

### Methods

| Method | Endpoint | Session issued | Rate limited |
|--------|----------|----------------|--------------|
| OTP (primary) | `POST /api/auth/otp/request` → `verify` | Yes | Yes (IP + phone, layered) |
| Password login | `POST /api/auth/login` | Yes | **No** |
| Password register | `POST /api/auth/register` | Yes | **No** |
| Password reset | `POST /api/auth/forgot-password/request` → `reset` | No | Request only (5/min); **reset none** |
| Logout | `POST /api/auth/logout` | Destroyed | N/A |

### Session model

```
Cookie: niloora_session = <64-char-hex-refresh>.<HS256-JWT-access>

Refresh token → SHA-256 hash implied via JWT `sth` claim match
DB Session row → expiry (default 30 days)
Access JWT → 24h exp, claims: sid, sth, uid, role
```

### Findings

| ID | Severity | Issue |
|----|----------|-------|
| SEC-A01 | **High** | Password `login` does not check `user.blocked` (OTP verify does) |
| SEC-A02 | **High** | Password `login` has no rate limiting (credential stuffing) |
| SEC-A03 | **High** | Password reset token = `randomBytes(4)` → **32-bit entropy** (~4.3B values) |
| SEC-A04 | **High** | `POST /api/auth/forgot-password/reset` has **no rate limiting** |
| SEC-A05 | **Medium** | OTP generated with `Math.random()` instead of `crypto.randomInt()` |
| SEC-A06 | **Medium** | `POST /api/auth/otp/request` returns `isNewUser` (phone enumeration) |
| SEC-A07 | **Medium** | `POST /api/auth/forgot-password/request` returns `404 phone_not_found` (enumeration) |
| SEC-A08 | **Low** | `register()` does not call `syncSessionAfterLogin()` (cookie timing edge case) |
| SEC-A09 | **Low** | bcrypt cost factor `10` — acceptable; consider 12 for high-value accounts |

**Blocked user bypass evidence:**

OTP path checks blocked status (`otp/verify/route.ts` lines 118–119). Login path (`login/route.ts`) compares password only — no `blocked` check before `createSession`.

---

## 3. Authorization Assessment

### Roles

| Role | Admin CMS | Content workflow | Account |
|------|-----------|------------------|---------|
| `user` | Denied | Denied | Allowed |
| `editor` | Posts only | draft/review | Allowed |
| `reviewer` | Posts only | review/publish | Allowed |
| `admin` | Full | Full | Allowed |

### Server-side guards

- `ensureAdmin(user)` — `src/lib/server/auth/guards.ts`
- `ensureContentWorkflowAccess(user)` — admin/editor/reviewer for posts
- `canTransitionPostStatus()` — workflow state machine
- Admin self-protection: cannot demote/block own account (`admin/users/[id]`)

### Findings

| ID | Severity | Issue |
|----|----------|-------|
| SEC-Z01 | **Critical** | `GET /api/comments?status=pending` — no auth; leaks moderation queue |
| SEC-Z02 | **Critical** | `GET /api/product-questions?status=pending` — same pattern |
| SEC-Z03 | **High** | Edge middleware uses JWT `role` without DB refresh → stale admin page access up to 24h after demotion |
| SEC-Z04 | **High** | Middleware does not verify DB session exists / user not blocked |
| SEC-Z05 | **Medium** | `GET /api/products/sales` — unauthenticated sales aggregates (business intel) |
| SEC-Z06 | **Medium** | `GET /api/gift-cards/balance?code=` — gift card probing without auth |
| SEC-Z07 | **Medium** | Admin media at `/uploads/admin-media/*` — public static serve, no auth |
| SEC-Z08 | **Low** | Client `AdminGuard` uses Redux role (can disagree with server briefly) |

**IDOR patterns (well-implemented):**

```17:20:src/app/api/orders/[id]/route.ts
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: orderInclude,
    });
```

Returns, UGC order linkage, and account PATCH all scope to `user.id` from session.

---

## 4. Middleware Assessment

**File:** `src/middleware.ts`

### Protected paths

| Pattern | Check |
|---------|-------|
| `/account`, `/account/*` | Session JWT required |
| `/admin/*` (except posts workflow) | JWT `role === admin` |
| `/admin/posts` | Content workflow roles |
| `/api/admin/*` | JWT + role (401/403 JSON) |

### Not protected by middleware

- All non-admin `/api/*` routes (rely on per-handler `readSessionUser`)
- Public pages, cron endpoints (secret header), health endpoint

### Findings

| ID | Severity | Issue |
|----|----------|-------|
| SEC-M01 | **High** | JWT-only edge auth — no `sth`/refresh hash or DB session validation |
| SEC-M02 | **High** | Stale `role` in JWT grants `/admin/*` page access after demotion |
| SEC-M03 | **Medium** | Broad matcher runs JWT parse on nearly all routes (perf, not direct vuln) |
| SEC-M04 | **Low** | No `Content-Security-Policy` header (documented intentional omission) |

**Edge vs server session gap:**

```32:58:src/lib/server/auth/session-edge.ts
export async function getEdgeSessionFromAccessToken(accessToken: string) {
  // Verifies JWT signature + extracts uid/role/sid
  // Does NOT: check refresh hash, DB session row, blocked status
}
```

```183:237:src/lib/server/auth/session.ts
export async function readSessionUser() {
  // Full validation: refresh hash match, DB session, blocked user, token refresh
}
```

---

## 5. Session & Cookie Assessment

### Cookie attributes

| Attribute | Value | Assessment |
|-----------|-------|------------|
| Name | `niloora_session` | OK |
| `httpOnly` | `true` | Prevents XSS cookie theft |
| `secure` | `true` in production | OK |
| `sameSite` | `lax` | Mitigates most CSRF on cross-site POST |
| `path` | `/` | Standard |
| `maxAge` | 30 days (refresh TTL) | Long-lived; acceptable with rotation |

### Findings

| ID | Severity | Issue |
|----|----------|-------|
| SEC-C01 | **Medium** | `sameSite: lax` — cross-site GET top-level navigations send cookie (acceptable trade-off) |
| SEC-C02 | **Medium** | No explicit CSRF tokens on state-changing APIs (mitigated by SameSite + same-origin default) |
| SEC-C03 | **Low** | Session fixation: new session created on login (no reuse of pre-auth session ID) — OK |
| SEC-C04 | **Low** | Logout uses fire-and-forget `apiFetch` — server session may persist if request fails |

---

## 6. JWT Handling Assessment

| Aspect | Implementation | Risk |
|--------|----------------|------|
| Algorithm | HS256 | OK if `SESSION_SECRET` strong (≥16 chars enforced at startup) |
| Secret storage | `SESSION_SECRET` env only | Not in client bundle |
| Access TTL | 24 hours | Long window for stolen token |
| Refresh binding | `sth` claim = SHA-256(refresh token) | Strong binding on server path |
| Edge verification | Signature only | Weaker than server path |
| Clock tolerance (server) | `refreshTtlMs()` (~30 days) on `jwtVerify` | Overly permissive exp leeway on server verify |

**Finding SEC-J01 (Medium):** `verifyAccessTokenLoose` uses `clockTolerance` equal to refresh TTL (~30 days). While DB session expiry provides a backstop, this widens the cryptographic acceptance window for access tokens beyond design intent.

---

## 7. API Route Security Matrix

### Authentication tiers

| Tier | Examples | Enforcement |
|------|----------|-------------|
| **Public read** | `/api/products`, `/api/home`, `/api/posts` | None |
| **Public write (unauthenticated)** | `/api/analytics/funnel`, `/api/ab/events`, `/api/trade-in`, `/api/support-requests` | Input validation only |
| **Optional session** | `/api/support-requests`, `/api/payments/zarinpal/request` | Guest checkout |
| **Session required** | `/api/account`, `/api/orders`, `/api/returns` | `readSessionUser()` |
| **Admin** | `/api/admin/*` | Middleware JWT + `ensureAdmin()` |
| **Content workflow** | `/api/admin/posts*` | Middleware + workflow guard |
| **Cron** | `/api/cron/*` | `x-cron-secret` header |
| **Health (detailed)** | `/api/health?detailed=1` | Optional `x-health-secret` |

### Endpoints lacking rate limits (non-exhaustive)

| Endpoint | Risk |
|----------|------|
| `POST /api/auth/login` | Credential stuffing |
| `POST /api/auth/register` | Account spam |
| `POST /api/auth/forgot-password/reset` | Reset token brute force |
| `POST /api/analytics/funnel` | Log injection / disk fill |
| `POST /api/ab/events` | Log injection |
| `POST /api/comments` | Spam (requires session) |
| `POST /api/support-requests` | Spam |
| `GET /api/gift-cards/balance` | Code enumeration |

### Well-protected endpoints

| Endpoint | Controls |
|----------|----------|
| `POST /api/auth/otp/*` | Layered IP + phone rate limits |
| `POST /api/auth/forgot-password/request` | 5 req/min per phone |
| `GET /api/comments/pending` | `ensureAdmin` |
| `PATCH /api/admin/users/[id]` | Admin only + audit log + self-protection |
| `POST /api/cron/*` | Shared secret header |

---

## 8. Database Access Assessment

### ORM usage

- **Primary:** Prisma Client with parameterized queries — **SQL injection risk: Low**
- **Raw SQL:** Two static templates only:
  - `env-validate.ts`: `SELECT 1` health check
  - `products.ts`: `information_schema.tables` existence check (no user input)

### NoSQL injection

Not applicable — PostgreSQL only.

### Sensitive data in DB

| Data | Protection |
|------|------------|
| `passwordHash` | bcrypt; never returned in DTOs |
| OTP `codeHash` | SHA-256; plain code never stored |
| Reset tokens | SHA-256 hash stored |
| Session refresh | SHA-256 via JWT `sth` binding |
| PII (national code, address) | Returned only to owner via `/api/account` |

---

## 9. Environment Variables & Secrets

### Required secrets (production)

| Variable | Exposure risk | Client visible |
|----------|---------------|--------------|
| `SESSION_SECRET` | **Critical** if leaked — forge sessions | No |
| `DATABASE_URL` | **Critical** — full DB access | No |
| `ABANDONED_CART_CRON_SECRET` | **High** — trigger cron jobs | No |
| `KAVENEGAR_API_KEY` | **High** — SMS abuse | No |
| `RESEND_API_KEY` | **High** — email abuse | No |
| `ZARINPAL_MERCHANT_ID` | **Medium** — payment config | No |
| `HEALTH_CHECK_SECRET` | **Low** — infra recon | No |
| `SENTRY_DSN` | **Low** — public by design | `NEXT_PUBLIC_SENTRY_DSN` yes |
| `SENTRY_AUTH_TOKEN` | **Medium** — build-time only | No |

### Secret exposure checks

| Check | Result |
|-------|--------|
| Secrets in `NEXT_PUBLIC_*` | Only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SENTRY_DSN` — expected |
| OTP preview in production API | Gated by `isOtpDevPreviewMode()` — OK |
| Reset token preview in production | Gated by `NODE_ENV === "production"` — OK |
| `.env.example` | Placeholder values only — OK |
| Startup validation | `validateProductionStartup()` fails on missing critical env — OK |
| `SESSION_SECRET` min length | 16 chars checked in health report — OK |

### Findings

| ID | Severity | Issue |
|----|----------|-------|
| SEC-E01 | **Medium** | `GET /api/health?detailed=1` public if `HEALTH_CHECK_SECRET` unset — exposes integration status |
| SEC-E02 | **Medium** | Single `ABANDONED_CART_CRON_SECRET` reused for all cron endpoints |
| SEC-E03 | **Low** | Zarinpal merchant ID can live in DB site settings — ensure admin access tightly controlled |

---

## 10. Vulnerability Findings by Class

### XSS (Cross-Site Scripting)

| ID | Severity | Finding |
|----|----------|---------|
| SEC-X01 | **Low** | `dangerouslySetInnerHTML` used only with `JSON.stringify()` for JSON-LD — server-controlled data, safe pattern |
| SEC-X02 | **Low** | Blog `PostBody` renders text via React children (auto-escaped) — safe |
| SEC-X03 | **Medium** | User-supplied `mediaUrl` in comments/UGC rendered in `<img>`/`<video src>` — not script injection but arbitrary external content |
| SEC-X04 | **Medium** | No Content-Security-Policy header — reduces defense-in-depth against XSS |

### CSRF (Cross-Site Request Forgery)

| ID | Severity | Finding |
|----|----------|---------|
| SEC-F01 | **Medium** | Cookie auth with `SameSite=Lax` — blocks cross-site POST subrequests; top-level GET cross-site still sends cookie |
| SEC-F02 | **Low** | No explicit CSRF tokens; acceptable for SPA + SameSite given current architecture |
| SEC-F03 | **Low** | No broad CORS headers — defaults deny cross-origin credentialed reads |

### SSRF (Server-Side Request Forgery)

| ID | Severity | Finding |
|----|----------|---------|
| SEC-S01 | **Low** | Server `fetch` only to fixed providers (Zarinpal, Kavenegar, Resend) — no user-controlled URLs |
| SEC-S02 | **Low** | UGC `mediaUrl` stored/displayed client-side; not fetched server-side |

### SQL Injection

| ID | Severity | Finding |
|----|----------|---------|
| SEC-Q01 | **Low** | Prisma parameterized queries throughout; raw SQL is static — **no findings** |

### NoSQL Injection

| ID | Severity | Finding |
|----|----------|---------|
| — | — | PostgreSQL only — **not applicable** |

### IDOR (Insecure Direct Object Reference)

| ID | Severity | Finding |
|----|----------|---------|
| SEC-I01 | **Low** | Orders, returns, preferences correctly scoped to `user.id` |
| SEC-I02 | **Medium** | Gift card balance by code — object reference without ownership check (by design, enumerable) |

### Privilege Escalation

| ID | Severity | Finding |
|----|----------|---------|
| SEC-P01 | **High** | Stale JWT admin `role` in middleware after demotion |
| SEC-P02 | **High** | Blocked users can password-login (OTP path blocks) |
| SEC-P03 | **Low** | `register` hardcodes `role: "user"` — cannot self-promote |
| SEC-P04 | **Low** | `PATCH /api/account` cannot change `role` — OK |

### Broken Access Control

| ID | Severity | Finding |
|----|----------|---------|
| SEC-B01 | **Critical** | Pending comments via public GET `?status=pending` |
| SEC-B02 | **Critical** | Pending questions via public GET `?status=pending` |
| SEC-B03 | **High** | Edge middleware weaker than API session validation |

### Open Redirects

| ID | Severity | Finding |
|----|----------|---------|
| SEC-R01 | **High** | `redirect` query param used in `router.replace(redirectTo)` without allowlist validation |
| SEC-R02 | **Low** | Middleware `redirectToAuth` uses server-controlled `pathname` only — safe |

**Open redirect evidence:**

```30:31:src/app/(auth)/auth/page.tsx
  const redirectTo = searchParams.get("redirect") || "/account";
  // ...
  router.replace(redirectTo);  // No validation — accepts //evil.com, https://evil.com
```

Also affects `useAuthPage`, `forgot-password/page.tsx`.

### Sensitive Data Exposure

| ID | Severity | Finding |
|----|----------|---------|
| SEC-D01 | **Critical** | Pre-moderation user content via comments/questions GET |
| SEC-D02 | **Medium** | Product sales aggregates publicly accessible |
| SEC-D03 | **Medium** | Gift card balance/expiry by code |
| SEC-D04 | **Medium** | Health detailed endpoint without secret |
| SEC-D05 | **Medium** | Admin audit logs store request payloads (admin-only access) |
| SEC-D06 | **Low** | OTP `isNewUser` flag in API response |

### Missing Rate Limiting

| ID | Severity | Finding |
|----|----------|---------|
| SEC-L01 | **High** | Password login — no limit |
| SEC-L02 | **High** | Password reset verify — no limit |
| SEC-L03 | **Medium** | Analytics/A/B public write endpoints |
| SEC-L04 | **Medium** | In-memory rate limiter not shared across serverless instances |

### Missing Input Validation

| ID | Severity | Finding |
|----|----------|---------|
| SEC-V01 | **Medium** | Admin media upload — extension from filename; no MIME whitelist; non-images stored as-is |
| SEC-V02 | **Medium** | Comment/UGC `mediaUrl` — `https?://` only; no domain allowlist |
| SEC-V03 | **Low** | `/api/account` PATCH has solid field validation |
| SEC-V04 | **Low** | Order admin PATCH validates against `isAdminSettableStatus` |

---

## 11. Critical Findings

### CRIT-01 — Unauthenticated read of pending comments

| Field | Value |
|-------|-------|
| **OWASP** | A01 Broken Access Control |
| **Endpoint** | `GET /api/comments?productId=X&status=pending` |
| **File** | `src/app/api/comments/route.ts` (lines 35–39) |
| **Impact** | Pre-moderation reviews (names, bodies, ratings, media URLs) readable by anyone |
| **Fix** | Ignore `status` for unauthenticated callers; require `ensureAdmin` for non-`approved` |

---

### CRIT-02 — Unauthenticated read of pending product questions

| Field | Value |
|-------|-------|
| **OWASP** | A01 Broken Access Control |
| **Endpoint** | `GET /api/product-questions?productId=X&status=pending` |
| **File** | `src/app/api/product-questions/route.ts` (line 73) |
| **Impact** | Unmoderated Q&A content exposure |
| **Fix** | Same as CRIT-01 |

---

## 12. High Findings

### HIGH-01 — Open redirect via `redirect` query parameter

| **OWASP** | A01 Broken Access Control / phishing |
| **Files** | `src/app/(auth)/auth/page.tsx`, `src/lib/hooks/useAuthPage.ts`, `src/app/(auth)/forgot-password/page.tsx` |
| **Attack** | `https://niloora.com/auth?redirect=//evil.com` → post-login `router.replace` navigates off-site |
| **Fix** | Allowlist relative paths starting with `/`; reject `//`, `http:`, `https:` |

---

### HIGH-02 — Edge middleware JWT role stale after admin demotion

| **OWASP** | A01 Broken Access Control |
| **Impact** | Demoted admin retains `/admin/*` page access until access JWT expires (~24h) |
| **Fix** | Edge middleware should validate session in DB or use shorter access TTL + role re-fetch |

---

### HIGH-03 — Edge middleware skips DB session / blocked-user checks

| **OWASP** | A07 Identification and Authentication Failures |
| **Impact** | Revoked/deleted sessions may pass middleware until JWT expires |
| **Mitigation** | API layer still enforces `readSessionUser()` — data mutations protected; page shell not |

---

### HIGH-04 — Password login ignores `user.blocked`

| **OWASP** | A07 Authentication Failures |
| **File** | `src/app/api/auth/login/route.ts` |
| **Impact** | Admin-blocked users authenticate via password; OTP path correctly returns 403 |
| **Fix** | Check `user.blocked` before `createSession` |

---

### HIGH-05 — No rate limiting on password login

| **OWASP** | A07 Authentication Failures |
| **File** | `src/app/api/auth/login/route.ts` |
| **Impact** | Credential stuffing / brute force at wire speed |
| **Fix** | Apply `checkRateLimit` per IP + per phone (mirror OTP limits) |

---

### HIGH-06 — Weak password-reset token (32-bit) + no reset rate limit

| **OWASP** | A07 Authentication Failures |
| **Files** | `src/lib/server/auth/password-reset.ts`, `src/app/api/auth/forgot-password/reset/route.ts` |
| **Impact** | 8-hex-char token brute-forceable within 30-min TTL |
| **Fix** | Use `randomBytes(32)`; add per-IP/phone rate limit on reset endpoint |

---

### HIGH-07 — Payment callback partial error handling (availability / integrity)

| **OWASP** | A04 Insecure Design |
| **File** | `src/app/api/payments/zarinpal/callback/route.ts` (lines 43–98 outside try) |
| **Impact** | Paid user may see 500 instead of success redirect on DB/session errors |
| **Cross-ref** | `docs/runtime-audit.md` C-01 |

---

### HIGH-08 — Gift-card purchase orphan orders on gateway failure

| **OWASP** | A04 Insecure Design |
| **File** | `src/app/api/gift-cards/purchase/route.ts` |
| **Impact** | Pending payment records without rollback |

---

### HIGH-09 — In-memory rate limiter ineffective on serverless multi-instance

| **OWASP** | A04 Insecure Design |
| **File** | `src/lib/server/rate-limit.ts` |
| **Impact** | OTP/login limits bypassed by distributing requests across instances |
| **Fix** | Redis/Upstash-backed rate limit for production |

---

### HIGH-10 — Public write endpoints without authentication or rate limits

| **OWASP** | A05 Security Misconfiguration |
| **Endpoints** | `POST /api/analytics/funnel`, `POST /api/ab/events` |
| **Impact** | Disk exhaustion, log poisoning |

---

### HIGH-11 — Cron endpoints share single secret

| **OWASP** | A04 Insecure Design |
| **Variable** | `ABANDONED_CART_CRON_SECRET` |
| **Impact** | One leaked secret authorizes all cron operations |

---

## 13. Medium Findings

| ID | Issue |
|----|-------|
| MED-01 | OTP uses `Math.random()` — prefer `crypto.randomInt()` |
| MED-02 | Phone enumeration via `isNewUser` on OTP request |
| MED-03 | Phone enumeration via `404` on forgot-password request |
| MED-04 | `GET /api/products/sales` — unauthenticated business metrics |
| MED-05 | `GET /api/gift-cards/balance` — gift card code probing |
| MED-06 | Admin uploads served publicly under `/uploads/admin-media/` |
| MED-07 | No Content-Security-Policy header |
| MED-08 | User `mediaUrl` in comments/UGC — arbitrary external content in product pages |
| MED-09 | Admin media upload lacks MIME type validation / SVG blocking |
| MED-10 | `GET /api/health?detailed=1` exposes integration status without secret |
| MED-11 | JWT `clockTolerance` set to refresh TTL (~30 days) on server verify |
| MED-12 | Access JWT lifetime 24h — long stolen-token window |
| MED-13 | Guest checkout auto-creates users (`checkout-user.ts`) — account sprawl |
| MED-14 | `POST /api/support-requests` — public spam vector (no CAPTCHA/rate limit) |
| MED-15 | `POST /api/register` — no rate limit (account farming) |
| MED-16 | Payment callback `notifyOrderPlaced` fire-and-forget — no delivery guarantee |
| MED-17 | Session cookie `sameSite: lax` — document threat model for cross-site flows |
| MED-18 | No `Secure` flag enforcement in non-production (expected for local dev) |

---

## 14. Low Findings

| ID | Issue |
|----|-------|
| LOW-01 | bcrypt cost factor 10 — consider increasing |
| LOW-02 | No explicit CSRF tokens (mitigated by SameSite) |
| LOW-03 | Logout fire-and-forget may leave server session |
| LOW-04 | Client `AdminGuard` trusts Redux role briefly |
| LOW-05 | `register()` missing `syncSessionAfterLogin()` |
| LOW-06 | JSON-LD `dangerouslySetInnerHTML` — safe with `JSON.stringify` |
| LOW-07 | Prisma static raw queries — no injection path |
| LOW-08 | No CORS — same-origin default |
| LOW-09 | `NEXT_PUBLIC_SENTRY_DSN` — expected public |
| LOW-10 | Predictable media asset IDs (timestamp-based) |
| LOW-11 | Dev OTP toast shows code in UI (dev only) |
| LOW-12 | Middleware referer-based redirect on access denied — same-origin only |

---

## 15. Positive Security Controls

| Control | Implementation |
|---------|----------------|
| HTTP-only session cookies | `sessionCookieOptions()` |
| Password hashing | bcrypt (cost 10) |
| OTP stored hashed | SHA-256 in `OtpVerificationCode` |
| Session binding | Refresh hash in JWT `sth` claim |
| Blocked user enforcement | `readSessionUser()` + OTP verify |
| Admin audit trail | `AdminAuditLog` on sensitive mutations |
| Layered OTP rate limits | IP + phone burst/hour/day |
| Server-authoritative pricing | Client cart prices discarded at checkout |
| IDOR prevention | `where: { userId: user.id }` on orders/returns |
| Role assignment hardening | Register forces `role: "user"`; admin PATCH self-guard |
| Production env fail-fast | `validateProductionStartup()` |
| Cron authentication | `x-cron-secret` required |
| Security headers | HSTS, X-Frame-Options, nosniff, Referrer-Policy |
| Payment verification | Zarinpal server-side verify before order finalization |
| Content workflow | Editor/reviewer cannot bypass publish rules |
| No secrets in client bundle | Except intentional `NEXT_PUBLIC_*` |

---

## 16. Remediation Priority

### P0 — Immediate (before production traffic)

| # | Finding | Action |
|---|---------|--------|
| 1 | CRIT-01, CRIT-02 | Restrict `status` param on public comment/question GET |
| 2 | HIGH-01 | Implement `safeRedirectPath()` allowlist |
| 3 | HIGH-04 | Add `blocked` check to password login |
| 4 | HIGH-05 | Rate-limit login endpoint |
| 5 | HIGH-06 | Strengthen reset token + rate-limit reset |

### P1 — Short term (1–2 sprints)

| # | Finding | Action |
|---|---------|--------|
| 6 | HIGH-02, HIGH-03 | Align edge middleware with DB session validation |
| 7 | HIGH-09 | Distributed rate limiting (Redis) |
| 8 | HIGH-10 | Auth or rate-limit analytics ingest |
| 9 | MED-05, MED-06 | Gift card probe throttling; protect upload paths |
| 10 | MED-07 | Add baseline CSP |

### P2 — Hardening

| # | Finding | Action |
|---|---------|--------|
| 11 | MED-01 | `crypto.randomInt` for OTP |
| 12 | HIGH-07, HIGH-08 | Payment flow error handling parity |
| 13 | MED-09 | MIME validation on admin uploads |
| 14 | HIGH-11 | Separate cron secrets per job |

---

## Appendix A — Cookie & Session Configuration Reference

```258:265:src/lib/server/auth/session.ts
function sessionCookieOptions(maxAgeSec?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec ?? refreshTtlMs() / 1000,
  };
}
```

## Appendix B — Rate Limit Coverage

| Endpoint / flow | Limited | Mechanism |
|-----------------|---------|-----------|
| OTP request | Yes | `assertOtpRequestRateLimit` |
| OTP verify | Yes | `assertOtpVerifyRateLimit` |
| Forgot-password request | Yes | 5/min per phone |
| Forgot-password reset | **No** | — |
| Password login | **No** | — |
| Register | **No** | — |
| Analytics funnel | **No** | — |
| A/B events | **No** | — |

## Appendix C — Middleware vs API Authorization Gap

```
Request → /admin/orders
  ├── Middleware: JWT role === "admin"?  → PASS (even if demoted in DB)
  ├── Page: AdminGuard checks Redux role → may disagree
  └── API: readSessionUser() + ensureAdmin → FRESH role from DB ✓
```

Data mutations remain protected; **page-level access control is the weak link**.

---

*End of security audit. No code was modified during this analysis.*
