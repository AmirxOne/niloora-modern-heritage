-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "minSubtotal" INTEGER NOT NULL DEFAULT 0,
    "replacesSiteWide" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_active_code_idx" ON "PromoCode"("active", "code");

-- Seed legacy promo codes
INSERT INTO "PromoCode" ("id", "code", "label", "type", "value", "minSubtotal", "replacesSiteWide", "active", "aliases", "updatedAt") VALUES
('haseeb-welcome', 'HASEEB10', 'خوش‌آمدگویی ابراهیم آذری', 'percent', 10, 50000000, true, true, '[]', CURRENT_TIMESTAMP),
('bahakahi-royal', 'BAHAKAHI20', 'بهاکاهی ویژه', 'percent', 20, 80000000, true, true, '["FUROOH20"]', CURRENT_TIMESTAMP),
('barakat-fixed', 'BARAKAT5M', 'برکت خرید', 'fixed', 5000000, 100000000, true, true, '[]', CURRENT_TIMESTAMP),
('atelier-stack', 'ATELIER15', 'کارگاه ابراهیم آذری', 'percent', 15, 0, false, true, '[]', CURRENT_TIMESTAMP);
