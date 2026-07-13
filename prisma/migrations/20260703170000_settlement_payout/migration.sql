-- MML-2: Settlement Eligibility & Payout Execution (additive, marketplace domain).

CREATE TYPE "SettlementStatus" AS ENUM ('eligible', 'settled', 'reversed');
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed');

CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "grossAmount" BIGINT NOT NULL,
    "commissionAmount" BIGINT NOT NULL,
    "netAmount" BIGINT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'eligible',
    "eligibleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "walletEntryId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Settlement_walletEntryId_key" ON "Settlement"("walletEntryId");
CREATE UNIQUE INDEX "Settlement_idempotencyKey_key" ON "Settlement"("idempotencyKey");
CREATE UNIQUE INDEX "Settlement_orderId_vendorId_key" ON "Settlement"("orderId", "vendorId");
CREATE INDEX "Settlement_vendorId_status_idx" ON "Settlement"("vendorId", "status");
CREATE INDEX "Settlement_status_eligibleAt_idx" ON "Settlement"("status", "eligibleAt");

ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_amounts_nonneg" CHECK ("grossAmount" >= 0 AND "commissionAmount" >= 0 AND "netAmount" >= 0);

CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "amount" BIGINT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "reference" TEXT NOT NULL,
    "debitEntryId" TEXT,
    "refundEntryId" TEXT,
    "failureReason" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "processedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payout_reference_key" ON "Payout"("reference");
CREATE UNIQUE INDEX "Payout_debitEntryId_key" ON "Payout"("debitEntryId");
CREATE UNIQUE INDEX "Payout_refundEntryId_key" ON "Payout"("refundEntryId");
CREATE INDEX "Payout_vendorId_status_idx" ON "Payout"("vendorId", "status");
CREATE INDEX "Payout_status_requestedAt_idx" ON "Payout"("status", "requestedAt");

ALTER TABLE "Payout" ADD CONSTRAINT "Payout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_amount_positive" CHECK ("amount" > 0);

CREATE TABLE "PayoutStatusHistory" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "fromStatus" "PayoutStatus",
    "toStatus" "PayoutStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PayoutStatusHistory_payoutId_createdAt_idx" ON "PayoutStatusHistory"("payoutId", "createdAt");

ALTER TABLE "PayoutStatusHistory" ADD CONSTRAINT "PayoutStatusHistory_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainEvent_idempotencyKey_key" ON "DomainEvent"("idempotencyKey");
CREATE INDEX "DomainEvent_processedAt_occurredAt_idx" ON "DomainEvent"("processedAt", "occurredAt");
CREATE INDEX "DomainEvent_aggregateType_aggregateId_idx" ON "DomainEvent"("aggregateType", "aggregateId");
CREATE INDEX "DomainEvent_type_occurredAt_idx" ON "DomainEvent"("type", "occurredAt");
