-- Phase 1: marketplace domain preparation (expand-only, zero behavior change).
-- Existing products: vendorId NULL, publicationStatus 'published'.

CREATE TYPE "ProductPublicationStatus" AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'published',
  'rejected',
  'archived'
);

CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

ALTER TABLE "Product" ADD COLUMN "vendorId" TEXT,
ADD COLUMN "publicationStatus" "ProductPublicationStatus" NOT NULL DEFAULT 'published';

CREATE INDEX "Product_vendorId_idx" ON "Product"("vendorId");
CREATE INDEX "Product_publicationStatus_idx" ON "Product"("publicationStatus");

ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
