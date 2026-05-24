-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "orderType" TEXT NOT NULL DEFAULT 'product',
ADD COLUMN "giftCardPurchaseAmount" INTEGER,
ADD COLUMN "giftCardRecipientName" TEXT,
ADD COLUMN "giftCardRecipientContact" TEXT;
