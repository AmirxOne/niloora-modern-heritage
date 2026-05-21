# Niloora — Luxury Persian Ring Atelier

A production-ready Next.js 14 frontend for luxury Persian ring e-commerce and advanced ring customization.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI / Low-Token Onboarding

For handing the project to another AI model (or another device), start with:

1. `PROJECT_AI_GUIDE.md`
2. `src/app/api/README.md`
3. `src/lib/README.md`
4. `src/components/README.md`

Then open section docs only as needed (for example `src/components/inputs/README.md`).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Cinematic home with hero, collections, bestsellers |
| `/shop` | Product grid with filters, wishlist, quick view |
| `/product/[id]` | Product detail, 360° preview UI, options |
| `/customize` | Full ring configurator with live preview & pricing |
| `/dashboard` | Profile, saved designs, orders, wishlist |
| `/about` | Brand story and craftsmanship process |

## Project Structure

```
src/
├── app/           # App Router pages
├── components/    # UI, layout, sections, shop, product, customizer
├── lib/           # Types, data, hooks, context, pricing
└── styles/        # Global CSS & Tailwind
```

## Features

- Luxury Persian design system (matte black, gold, turquoise, ivory)
- Real-time ring customizer with SVG preview
- Cart & wishlist (localStorage)
- Simulated checkout flow
- Save & share custom designs
- Framer Motion animations throughout

## Build

```bash
npm run build
npm start
```
