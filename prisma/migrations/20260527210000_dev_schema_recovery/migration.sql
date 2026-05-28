-- Dev schema recovery: apply missing columns/tables without failing on partial drift.

-- UserPreference
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "wishlistPriceWatch" JSONB;

-- Order loyalty + campaign fields
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "loyaltyDiscountAmount" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "loyaltyPointsEarned" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "loyaltyTier" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignDiscountAmount" INTEGER;

-- ProductComment extended ratings / media
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "isVerifiedBuyer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "ratingBuildQuality" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "ratingBeauty" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "ratingValue" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "ProductComment" ADD COLUMN IF NOT EXISTS "ratingPackaging" INTEGER NOT NULL DEFAULT 5;

-- Discount campaigns
CREATE TABLE IF NOT EXISTS "DiscountCampaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "minSubtotal" INTEGER NOT NULL DEFAULT 0,
    "targetScope" TEXT NOT NULL DEFAULT 'all',
    "targetProductIds" JSONB NOT NULL DEFAULT '[]',
    "targetCollectionIds" JSONB NOT NULL DEFAULT '[]',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "replacesSiteWide" BOOLEAN NOT NULL DEFAULT false,
    "linkedPromoCodeId" TEXT,
    "bannerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bannerBadge" TEXT,
    "bannerTitle" TEXT,
    "bannerSubtitle" TEXT,
    "bannerCtaLabel" TEXT,
    "bannerCtaHref" TEXT,
    "bannerImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscountCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DiscountCampaignUsage" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "discountAmount" INTEGER NOT NULL,
    "orderSubtotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscountCampaignUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCampaign_slug_key" ON "DiscountCampaign"("slug");
CREATE INDEX IF NOT EXISTS "DiscountCampaign_active_startsAt_endsAt_idx" ON "DiscountCampaign"("active", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "DiscountCampaign_slug_idx" ON "DiscountCampaign"("slug");
CREATE INDEX IF NOT EXISTS "DiscountCampaign_linkedPromoCodeId_idx" ON "DiscountCampaign"("linkedPromoCodeId");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCampaignUsage_orderId_campaignId_key" ON "DiscountCampaignUsage"("orderId", "campaignId");
CREATE INDEX IF NOT EXISTS "DiscountCampaignUsage_campaignId_createdAt_idx" ON "DiscountCampaignUsage"("campaignId", "createdAt");
CREATE INDEX IF NOT EXISTS "DiscountCampaignUsage_userId_createdAt_idx" ON "DiscountCampaignUsage"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_campaignId_idx" ON "Order"("campaignId");

-- Product UGC
CREATE TABLE IF NOT EXISTS "ProductUgcMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "caption" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductUgcMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductUgcMedia_productId_status_createdAt_idx" ON "ProductUgcMedia"("productId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductUgcMedia_userId_status_createdAt_idx" ON "ProductUgcMedia"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductUgcMedia_status_createdAt_idx" ON "ProductUgcMedia"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "ProductAuthenticityVerification" (
    "id" TEXT NOT NULL,
    "pieceCodeInput" TEXT NOT NULL,
    "pieceCodeNormalized" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "productId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAuthenticityVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductAuthenticityVerification_pieceCodeNormalized_verifie_idx" ON "ProductAuthenticityVerification"("pieceCodeNormalized", "verifiedAt");
CREATE INDEX IF NOT EXISTS "ProductAuthenticityVerification_status_verifiedAt_idx" ON "ProductAuthenticityVerification"("status", "verifiedAt");
CREATE INDEX IF NOT EXISTS "ProductAuthenticityVerification_productId_verifiedAt_idx" ON "ProductAuthenticityVerification"("productId", "verifiedAt");
