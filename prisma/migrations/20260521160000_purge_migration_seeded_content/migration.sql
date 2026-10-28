-- Purge legacy demo data that was baked into older migrations (an
-- anti-pattern: migrations should only change schema, not ship content).
-- Fresh databases will no longer receive these; existing ones get cleaned.
-- Real content comes from `npm run db:seed` (prisma/seed.ts) instead.

DELETE FROM "PromoCode"
WHERE "id" IN ('haseeb-welcome', 'bahakahi-royal', 'barakat-fixed', 'atelier-stack')
   OR "code" IN ('HASEEB10', 'BAHAKAHI20', 'BARAKAT5M', 'ATELIER15');

DELETE FROM "Post"
WHERE "id" IN ('post-gem-guide', 'post-engraving')
   OR "slug" IN ('how-to-choose-gemstone', 'engraving-and-calligraphy');
