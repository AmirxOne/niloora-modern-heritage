-- CreateTable
CREATE TABLE "DiscountCampaign" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCampaignUsage" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "discountAmount" INTEGER NOT NULL,
    "orderSubtotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCampaignUsage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "campaignId" TEXT,
ADD COLUMN "campaignDiscountAmount" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCampaign_slug_key" ON "DiscountCampaign"("slug");

-- CreateIndex
CREATE INDEX "DiscountCampaign_active_startsAt_endsAt_idx" ON "DiscountCampaign"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "DiscountCampaign_slug_idx" ON "DiscountCampaign"("slug");

-- CreateIndex
CREATE INDEX "DiscountCampaign_linkedPromoCodeId_idx" ON "DiscountCampaign"("linkedPromoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCampaignUsage_orderId_campaignId_key" ON "DiscountCampaignUsage"("orderId", "campaignId");

-- CreateIndex
CREATE INDEX "DiscountCampaignUsage_campaignId_createdAt_idx" ON "DiscountCampaignUsage"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscountCampaignUsage_userId_createdAt_idx" ON "DiscountCampaignUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_campaignId_idx" ON "Order"("campaignId");

-- AddForeignKey
ALTER TABLE "DiscountCampaign" ADD CONSTRAINT "DiscountCampaign_linkedPromoCodeId_fkey" FOREIGN KEY ("linkedPromoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCampaignUsage" ADD CONSTRAINT "DiscountCampaignUsage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DiscountCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCampaignUsage" ADD CONSTRAINT "DiscountCampaignUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCampaignUsage" ADD CONSTRAINT "DiscountCampaignUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DiscountCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
