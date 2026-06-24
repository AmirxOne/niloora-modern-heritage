-- Phase B1: vendor commission rules + payout ledger (additive).

CREATE TYPE "CommissionType" AS ENUM ('percentage', 'fixed');

CREATE TYPE "VendorPayoutLedgerStatus" AS ENUM ('pending', 'eligible', 'paid', 'reversed');

CREATE TABLE "VendorCommissionRule" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "commissionType" "CommissionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "label" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCommissionRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorCommissionRule_vendorId_effectiveFrom_idx" ON "VendorCommissionRule"("vendorId", "effectiveFrom");

CREATE TABLE "VendorPayoutLedger" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "vendorId" TEXT,
    "grossAmount" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "commissionRuleId" TEXT,
    "commissionType" "CommissionType",
    "commissionRateBps" INTEGER,
    "status" "VendorPayoutLedgerStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "VendorPayoutLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorPayoutLedger_orderItemId_key" ON "VendorPayoutLedger"("orderItemId");

CREATE INDEX "VendorPayoutLedger_vendorId_status_idx" ON "VendorPayoutLedger"("vendorId", "status");

CREATE INDEX "VendorPayoutLedger_orderId_idx" ON "VendorPayoutLedger"("orderId");

ALTER TABLE "VendorCommissionRule" ADD CONSTRAINT "VendorCommissionRule_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorCommissionRule" ADD CONSTRAINT "VendorCommissionRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorPayoutLedger" ADD CONSTRAINT "VendorPayoutLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorPayoutLedger" ADD CONSTRAINT "VendorPayoutLedger_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorPayoutLedger" ADD CONSTRAINT "VendorPayoutLedger_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorPayoutLedger" ADD CONSTRAINT "VendorPayoutLedger_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "VendorCommissionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Platform default: 10% commission (1000 basis points).
INSERT INTO "VendorCommissionRule" (
    "id",
    "vendorId",
    "commissionType",
    "value",
    "effectiveFrom",
    "label",
    "createdAt",
    "updatedAt"
)
VALUES (
    'platform-default-commission',
    NULL,
    'percentage',
    1000,
    CURRENT_TIMESTAMP,
    'Platform default 10%',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
