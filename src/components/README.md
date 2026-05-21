# Components Map

Domain-driven UI folders. Read only the folder related to your task.

## Core Domains
- `layout/` - header, footer, chrome wrappers
- `shop/` - product cards, filters, listing UI
- `product/` - product detail UI, gallery, comments
- `customizer/` - ring builder UI, wizard, previews
- `cart/` - cart lines, checkout side widgets
- `account/` - account dashboard shell and panels
- `auth/` - auth page building blocks
- `dashboard/` - order history / moderation widgets

## Shared UI
- `ui/` - low-level controls and generic widgets
- `inputs/` - canonical form field components (single source)
- `icons/` - canonical icon exports (iconsax aliases)

## Hard Rules
- Import form fields from `@/components/inputs`
- Import icons from `@/components/icons`
- Prefer composing domain components over duplicating markup
