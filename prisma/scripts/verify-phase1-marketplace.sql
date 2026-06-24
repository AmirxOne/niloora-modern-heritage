-- Post-deploy verification for Phase 1 (marketplace domain prep).
-- All checks should pass before enabling Phase 2 catalog filters.

-- 1. Every product is platform-owned and published (legacy behavior preserved).
SELECT COUNT(*) AS total_products FROM "Product";
SELECT COUNT(*) AS non_published FROM "Product" WHERE "publicationStatus" <> 'published';
SELECT COUNT(*) AS vendor_owned FROM "Product" WHERE "vendorId" IS NOT NULL;

-- 2. Vendor table exists and is empty (unused until Phase 3).
SELECT COUNT(*) AS vendor_rows FROM "Vendor";

-- Expected: non_published = 0, vendor_owned = 0, vendor_rows = 0 (after Phase 1 deploy).
