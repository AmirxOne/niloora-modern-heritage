-- CreateTable
CREATE TABLE "HomeSliderItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSliderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeBannerSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "badge" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "percent" INTEGER NOT NULL DEFAULT 20,
    "ctaLabel" TEXT,
    "ctaHref" TEXT NOT NULL DEFAULT '/shop',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBannerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeSliderItem_productId_key" ON "HomeSliderItem"("productId");

-- CreateIndex
CREATE INDEX "HomeSliderItem_active_sortOrder_idx" ON "HomeSliderItem"("active", "sortOrder");

-- AddForeignKey
ALTER TABLE "HomeSliderItem" ADD CONSTRAINT "HomeSliderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default banner (Persian copy aligned with storefront)
INSERT INTO "HomeBannerSettings" ("id", "enabled", "badge", "title", "subtitle", "percent", "ctaLabel", "ctaHref", "updatedAt")
VALUES (
    'default',
    true,
    'بهاکاهی',
    'جشنواره بهاکاهی گالری',
    '۲۰٪ بهاکاهی اضافه در سبد · کدهای ویژه در تسویه',
    20,
    'ورود به گالری',
    '/shop',
    CURRENT_TIMESTAMP
);
