-- CreateTable
CREATE TABLE IF NOT EXISTS "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "brandName" TEXT NOT NULL,
    "brandTagline" TEXT NOT NULL,
    "shortDescription" TEXT,
    "logoUrl" TEXT,
    "contactPhone" TEXT,
    "contactPhoneSecondary" TEXT,
    "socialInstagram" TEXT,
    "socialTelegram" TEXT,
    "socialWhatsapp" TEXT,
    "socialTwitter" TEXT,
    "socialYoutube" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoOgImageUrl" TEXT,
    "paymentGatewayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "paymentProvider" TEXT NOT NULL DEFAULT 'zarinpal',
    "zarinpalMerchantId" TEXT,
    "zarinpalSandbox" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsProvider" TEXT NOT NULL DEFAULT 'kavenegar',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
