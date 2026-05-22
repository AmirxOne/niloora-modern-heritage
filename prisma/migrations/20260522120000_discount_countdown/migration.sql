-- Site-wide festival countdown (HomeBannerSettings) + per-product countdown
ALTER TABLE "HomeBannerSettings" ADD COLUMN "countdownEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "HomeBannerSettings" ADD COLUMN "countdownEndsAt" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN "discountEndsAt" TIMESTAMP(3);

UPDATE "HomeBannerSettings"
SET "countdownEndsAt" = '2026-06-10 20:29:59'::timestamp
WHERE "id" = 'default';
