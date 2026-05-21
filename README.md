# Niloora - Modern Heritage Jewelry Commerce

A production-grade Next.js 14 e-commerce platform for Persian (RTL) jewelry storefronts with a "Modern Heritage" UI/UX system, product management APIs, checkout flow, and admin tools.

## Highlights

- Full RTL Persian-first storefront and account experience
- Modern Heritage design system across layout, cards, and components
- Advanced shop listing with filters, sorting, wishlist, compare, and pagination
- Product detail pages with status handling, discounts, and commerce actions
- Cart validation/sanitization API for unavailable, sold, or deleted products
- Checkout pipeline with shipping methods, order timeline, and notifications
- Admin APIs and dashboards for products, orders, promos, posts, support requests
- Prisma + PostgreSQL backend layer with typed server services
- Integrated optional channels: OTP/SMS, Zarinpal payment, Sentry, Telegram sync

## Tech Stack

- `Next.js 14` (App Router)
- `React 18` + `TypeScript`
- `Tailwind CSS` (custom design tokens in `globals.css` and `tailwind.config.ts`)
- `Redux Toolkit` for client state
- `Prisma` + `PostgreSQL`
- `Vitest` for unit/integration tests
- `Sonner` for toast UX

## Key Routes

- `/` - Home
- `/shop` - Catalog with filtering/sorting
- `/product/[id]` - Product details
- `/cart` - Cart
- `/customize` - Ring customizer
- `/account` - User account and order history
- `/dashboard` - User dashboard
- `/admin/*` - Admin panel sections
- `/api/*` - REST-like route handlers (auth, products, orders, admin, payments, ...)

## Project Structure

```text
src/
  app/            # Next.js routes (pages + API handlers)
  components/     # UI, layout, sections, product/shop/dashboard components
  lib/            # Domain logic: hooks, server services, store, utilities, i18n
  styles/         # Global styles and Tailwind component layers
prisma/           # Schema, migrations, seed scripts
scripts/          # Utility and sync scripts
```

## Getting Started

### 1) Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

### 2) Install Dependencies

```bash
npm install
```

### 3) Configure Environment

Copy and edit environment variables:

```bash
cp .env.example .env.local
```

Required minimum values for local development:

- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL`
- `SESSION_SECRET`

Optional integrations:

- `KAVENEGAR_*` for SMS/OTP
- `ZARINPAL_*` for payment
- `SENTRY_*` for observability
- `RESEND_*` for email notifications

### 4) Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run db:seed
```

### 5) Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run lint checks
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run development migrations
- `npm run prisma:migrate:deploy` - Apply migrations in production
- `npm run db:seed` - Seed local database
- `npm run telegram:init-session` - Initialize Telegram session
- `npm run telegram:sync` - Incremental Telegram sync
- `npm run telegram:sync:full` - Full Telegram sync
- `npm run telegram:listen` - Listen mode for Telegram sync

## Git Workflow (Recommended)

This repository uses a `develop -> master` flow:

- `develop`: active development branch
- `master`: stable/release branch

Typical flow:

1. Branch from `develop` into `feature/<name>`
2. Open PR into `develop`
3. After verification, merge `develop` into `master` for release

## Deployment Notes

- Set production env vars in your hosting provider
- Run `npm run prisma:migrate:deploy` during deployment
- Build with `npm run build` and serve with `npm run start`
- Ensure `NEXT_PUBLIC_SITE_URL` matches the production domain

## AI Handover Docs

For fast onboarding of another developer/agent:

1. `PROJECT_AI_GUIDE.md`
2. `src/app/api/README.md`
3. `src/lib/README.md`
4. `src/components/README.md`

## Security

- Never commit `.env.local` or any private secrets
- Rotate leaked keys immediately if exposed
- Review API routes and admin guards before production launch

## License

Private project. Add a license file if you plan to open-source this repository.
