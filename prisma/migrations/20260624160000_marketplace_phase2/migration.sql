-- Phase 2: marketplace activation (additive).

CREATE TYPE "VendorStatus" AS ENUM (
  'draft',
  'pending_review',
  'active',
  'suspended',
  'rejected',
  'archived'
);

CREATE TYPE "VendorMemberRole" AS ENUM ('owner', 'staff');

ALTER TABLE "Vendor" ADD COLUMN "displayNameFa" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "status" "VendorStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3);

CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

CREATE TABLE "VendorSettings" (
    "vendorId" TEXT NOT NULL,
    "maxActiveProducts" INTEGER NOT NULL DEFAULT 3,
    "maxPendingSubmissions" INTEGER NOT NULL DEFAULT 5,
    "quotaMode" TEXT NOT NULL DEFAULT 'fixed',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettings_pkey" PRIMARY KEY ("vendorId")
);

CREATE TABLE "VendorMember" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "VendorMemberRole" NOT NULL DEFAULT 'owner',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorMember_vendorId_userId_key" ON "VendorMember"("vendorId", "userId");
CREATE UNIQUE INDEX "VendorMember_userId_key" ON "VendorMember"("userId");
CREATE INDEX "VendorMember_vendorId_idx" ON "VendorMember"("vendorId");

CREATE TABLE "ProductModerationEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vendorId" TEXT,
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "fromStatus" "ProductPublicationStatus",
    "toStatus" "ProductPublicationStatus" NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModerationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductModerationEvent_productId_createdAt_idx" ON "ProductModerationEvent"("productId", "createdAt");
CREATE INDEX "ProductModerationEvent_toStatus_createdAt_idx" ON "ProductModerationEvent"("toStatus", "createdAt");
CREATE INDEX "ProductModerationEvent_vendorId_createdAt_idx" ON "ProductModerationEvent"("vendorId", "createdAt");

ALTER TABLE "OrderItem" ADD COLUMN "vendorId" TEXT;

CREATE INDEX "OrderItem_vendorId_idx" ON "OrderItem"("vendorId");

ALTER TABLE "VendorSettings" ADD CONSTRAINT "VendorSettings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorMember" ADD CONSTRAINT "VendorMember_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorMember" ADD CONSTRAINT "VendorMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductModerationEvent" ADD CONSTRAINT "ProductModerationEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductModerationEvent" ADD CONSTRAINT "ProductModerationEvent_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
