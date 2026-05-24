-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "bundleDiscount" INTEGER,
ADD COLUMN "appliedBundles" JSONB;
