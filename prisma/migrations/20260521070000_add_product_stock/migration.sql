-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1;

-- موجودی صفر برای اثرهای فروخته‌شده
UPDATE "Product" SET "stock" = 0 WHERE "availability" = 'sold';
