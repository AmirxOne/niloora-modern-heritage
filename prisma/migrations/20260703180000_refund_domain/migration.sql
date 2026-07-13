-- MML-1: Refund Domain & Settlement Reversal (additive, marketplace/payments domain).

CREATE TYPE "RefundStatus" AS ENUM ('requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed');
CREATE TYPE "RefundType" AS ENUM ('full', 'partial');
CREATE TYPE "SettlementReversalOutcome" AS ENUM ('wallet_compensated', 'payout_adjustment_required');
CREATE TYPE "PayoutRecoveryStatus" AS ENUM ('pending', 'recovered', 'written_off');

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderReturnId" TEXT,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "amount" BIGINT NOT NULL,
    "type" "RefundType" NOT NULL DEFAULT 'partial',
    "status" "RefundStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "reference" TEXT NOT NULL,
    "failureReason" TEXT,
    "requestedById" TEXT,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "processedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Refund_reference_key" ON "Refund"("reference");
CREATE INDEX "Refund_orderId_status_idx" ON "Refund"("orderId", "status");
CREATE INDEX "Refund_status_requestedAt_idx" ON "Refund"("status", "requestedAt");
CREATE INDEX "Refund_userId_createdAt_idx" ON "Refund"("userId", "createdAt");

ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderReturnId_fkey" FOREIGN KEY ("orderReturnId") REFERENCES "OrderReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_amount_positive" CHECK ("amount" > 0);

CREATE TABLE "RefundStatusHistory" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "fromStatus" "RefundStatus",
    "toStatus" "RefundStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RefundStatusHistory_refundId_createdAt_idx" ON "RefundStatusHistory"("refundId", "createdAt");

ALTER TABLE "RefundStatusHistory" ADD CONSTRAINT "RefundStatusHistory_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SettlementReversal" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "outcome" "SettlementReversalOutcome" NOT NULL,
    "walletEntryId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementReversal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SettlementReversal_walletEntryId_key" ON "SettlementReversal"("walletEntryId");
CREATE UNIQUE INDEX "SettlementReversal_idempotencyKey_key" ON "SettlementReversal"("idempotencyKey");
CREATE INDEX "SettlementReversal_refundId_idx" ON "SettlementReversal"("refundId");
CREATE INDEX "SettlementReversal_settlementId_idx" ON "SettlementReversal"("settlementId");
CREATE INDEX "SettlementReversal_vendorId_idx" ON "SettlementReversal"("vendorId");

ALTER TABLE "SettlementReversal" ADD CONSTRAINT "SettlementReversal_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SettlementReversal" ADD CONSTRAINT "SettlementReversal_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementReversal" ADD CONSTRAINT "SettlementReversal_amount_nonneg" CHECK ("amount" >= 0);

CREATE TABLE "PayoutRecovery" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "settlementReversalId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "amount" BIGINT NOT NULL,
    "status" "PayoutRecoveryStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRecovery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutRecovery_settlementReversalId_key" ON "PayoutRecovery"("settlementReversalId");
CREATE UNIQUE INDEX "PayoutRecovery_idempotencyKey_key" ON "PayoutRecovery"("idempotencyKey");
CREATE INDEX "PayoutRecovery_vendorId_status_idx" ON "PayoutRecovery"("vendorId", "status");
CREATE INDEX "PayoutRecovery_refundId_idx" ON "PayoutRecovery"("refundId");

ALTER TABLE "PayoutRecovery" ADD CONSTRAINT "PayoutRecovery_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutRecovery" ADD CONSTRAINT "PayoutRecovery_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayoutRecovery" ADD CONSTRAINT "PayoutRecovery_settlementReversalId_fkey" FOREIGN KEY ("settlementReversalId") REFERENCES "SettlementReversal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutRecovery" ADD CONSTRAINT "PayoutRecovery_amount_positive" CHECK ("amount" > 0);
