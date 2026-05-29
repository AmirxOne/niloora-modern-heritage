-- AlterTable
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripMode" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripImageUrl" TEXT;
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripBadge" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripSubtitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripCtaLabel" TEXT;
ALTER TABLE "HomeBannerSettings" ADD COLUMN IF NOT EXISTS "headerStripCtaHref" TEXT NOT NULL DEFAULT '/shop';
