# Lib Architecture Map

`src/lib` contains app logic, state, and server helpers.

## Folders
- `hooks/` - client integration layer (API calls, toasts, orchestration)
- `store/` - Redux slices, middleware, hydration
- `context/` - top-level composition (`AppContext`)
- `server/` - server-only logic used by API handlers
- `auth/` - auth utilities and schemas
- `customizer/` - configurator catalog + compatibility logic
- `i18n/` - localized text dictionary

## Critical Runtime Flows
- Auth client gateway: `hooks/useAuth.ts`
- Account data sync: `hooks/useAccount.ts`
- Preferences sync: `hooks/useUserPreferencesSync.ts` + `hooks/usePersistUserPreferences.ts`
- App composition: `context/AppContext.tsx`
- Product Q&A client flow: `hooks/useProductQuestions.ts`

## Redux Slice Overview
- `auth`, `cart`, `wishlist`, `compareList`, `recentlyViewed`, `designs`, `promo`, `customizer`, `productSales`

## Invariants
- Server computes prices (`server/order-pricing.ts`)
- Session DTO mapping is explicit (`server/auth/dto.ts`)
- Session cookie trust boundary is centralized (`server/auth/session.ts`)

## Read Strategy
Start with the nearest hook/slice to your feature, then jump to matching API route and `server/*` helper.
