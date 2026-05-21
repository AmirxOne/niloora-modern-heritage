# App Router Map

Use this file before scanning pages.

## Route Groups
- Public pages: `/`, `/shop`, `/product/[id]`, `/customize`, `/pre-owned`, `/about`, `/blog`, `/cart`
- Account/auth pages: `/account` (section hashes e.g. `#orders`), legacy `/dashboard` → `/account`, and `(auth)` routes
- Admin pages: `/admin/*` (middleware + `AdminGuard`; role `admin` in session JWT)
- Edge middleware: `src/middleware.ts` — protects `/account`, `/admin`, `/api/admin`; redirects `/dashboard` to `/account`
- Layouts:
  - `layout.tsx`: global providers, fonts, toaster, digit enforcer
  - `(auth)/layout.tsx`: lightweight auth wrapper

## Backend API Entry
- All API contracts live in `src/app/api/**/route.ts`
- Read `src/app/api/README.md` first for endpoint map

## Typical Read Order For Page Bugs
1. target `page.tsx`
2. related domain components in `src/components/*`
3. related hooks in `src/lib/hooks/*`
4. matching API route (if server data involved)
