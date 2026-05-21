-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingMethod" TEXT,
ADD COLUMN     "shippingCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackingCode" TEXT;
