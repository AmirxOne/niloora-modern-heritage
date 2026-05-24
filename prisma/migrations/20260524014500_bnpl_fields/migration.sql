-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "installmentMonths" INTEGER,
ADD COLUMN "installmentAmount" INTEGER;
