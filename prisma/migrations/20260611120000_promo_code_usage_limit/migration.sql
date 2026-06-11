-- Per-code usage cap for promo codes.
ALTER TABLE "PromoCode" ADD COLUMN "maxUses" INTEGER;
ALTER TABLE "PromoCode" ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;
