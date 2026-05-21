# Niloora AI Quick Map

Goal: make onboarding cheap for any AI model (minimum context tokens, maximum coverage).

## Fast Read Order (token-efficient)
1. This file (`PROJECT_AI_GUIDE.md`)
2. `src/app/api/README.md` (all backend contracts)
3. `src/lib/README.md` (state, hooks, server boundaries)
4. `src/components/README.md` (UI domain map)
5. Section-specific docs only when needed:
   - `src/components/inputs/README.md`
   - `src/lib/server/README.md`
   - `src/app/README.md`

## Architecture Snapshot
- Framework: Next.js App Router (`src/app`)
- DB/ORM: PostgreSQL + Prisma (`prisma/schema.prisma`, `src/lib/server/prisma.ts`)
- Auth: cookie session + OTP/password (`src/lib/server/auth`, `src/app/api/auth/*`)
- Client state: Redux store + hooks (`src/lib/store`, `src/lib/hooks`)
- UI: domain-based components (`src/components/*`)

## Non-Negotiable Invariants
- **Pricing integrity:** totals from client are never trusted; server reprices (`src/lib/server/order-pricing.ts`).
- **Auth identity:** session cookie is validated against signed token + DB session (`src/lib/server/auth/session.ts`).
- **Username policy:** session DTO returns `name = phone` intentionally (`src/lib/server/auth/dto.ts`).
- **Inputs source of truth:** import form fields from `@/components/inputs`.
- **Icon source of truth:** import icons from `@/components/icons` (iconsax-based).

## High-Signal Entry Files
- `src/app/layout.tsx`
- `src/lib/context/AppContext.tsx`
- `src/lib/hooks/useAuth.ts`
- `src/lib/hooks/useAccount.ts`
- `src/lib/server/auth/session.ts`
- `src/lib/server/products.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/account/route.ts`
- `src/app/api/user/preferences/route.ts`

## Token Saving Tips For AI
- Do not read `src/lib/i18n/fa.ts` unless text/localization change is needed.
- Do not read `src/styles/globals.css` fully unless styling/token utility is the task.
- Start from route handler or hook nearest to the user request, then fan out.
- Prefer directory README files before scanning many source files.

## Validation Routine After Changes
- `npm run lint`
- `npm run build`
