/*
  Warnings:

  - Added the required column `ratingBeauty` to the `ProductComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratingBuildQuality` to the `ProductComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratingPackaging` to the `ProductComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratingValue` to the `ProductComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomizerQuoteRequest" ADD COLUMN     "etaDays" INTEGER,
ADD COLUMN     "etaUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "liveStage" TEXT NOT NULL DEFAULT 'received',
ADD COLUMN     "workshopLiveMessage" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "loyaltyDiscountAmount" INTEGER,
ADD COLUMN     "loyaltyPointsEarned" INTEGER,
ADD COLUMN     "loyaltyTier" TEXT;

-- AlterTable
ALTER TABLE "ProductComment" ADD COLUMN     "isVerifiedBuyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "ratingBeauty" INTEGER NOT NULL,
ADD COLUMN     "ratingBuildQuality" INTEGER NOT NULL,
ADD COLUMN     "ratingPackaging" INTEGER NOT NULL,
ADD COLUMN     "ratingValue" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loyaltyLifetimeSpend" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyTier" TEXT NOT NULL DEFAULT 'bronze';

-- CreateTable
CREATE TABLE "ProductUgcMedia" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUgcMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAuthenticityVerification" (
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

-- CreateIndex
CREATE INDEX "ProductUgcMedia_productId_status_createdAt_idx" ON "ProductUgcMedia"("productId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductUgcMedia_userId_status_createdAt_idx" ON "ProductUgcMedia"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductUgcMedia_status_createdAt_idx" ON "ProductUgcMedia"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAuthenticityVerification_pieceCodeNormalized_verifie_idx" ON "ProductAuthenticityVerification"("pieceCodeNormalized", "verifiedAt");

-- CreateIndex
CREATE INDEX "ProductAuthenticityVerification_status_verifiedAt_idx" ON "ProductAuthenticityVerification"("status", "verifiedAt");

-- CreateIndex
CREATE INDEX "ProductAuthenticityVerification_productId_verifiedAt_idx" ON "ProductAuthenticityVerification"("productId", "verifiedAt");

-- AddForeignKey
ALTER TABLE "ProductUgcMedia" ADD CONSTRAINT "ProductUgcMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUgcMedia" ADD CONSTRAINT "ProductUgcMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUgcMedia" ADD CONSTRAINT "ProductUgcMedia_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAuthenticityVerification" ADD CONSTRAINT "ProductAuthenticityVerification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
