-- Remove internal Wallet domain. Settlement = payable; Payout = bank transfer.
-- CHECK constraints for PayoutSettlement.amount stay in SQL (Prisma schema omits @@check).

-- 1. SettlementStatus: add paid_out
ALTER TYPE "SettlementStatus" ADD VALUE IF NOT EXISTS 'paid_out' BEFORE 'reversed';

-- 2. SettlementReversalOutcome: rename wallet_compensated -> settlement_reversed
ALTER TYPE "SettlementReversalOutcome" RENAME VALUE 'wallet_compensated' TO 'settlement_reversed';

-- 3. Settlement: drop walletEntryId, add paidOutAt
DROP INDEX IF EXISTS "Settlement_walletEntryId_key";
ALTER TABLE "Settlement" DROP COLUMN IF EXISTS "walletEntryId";
ALTER TABLE "Settlement" ADD COLUMN IF NOT EXISTS "paidOutAt" TIMESTAMP(3);

-- 4. Payout: drop wallet entry refs
DROP INDEX IF EXISTS "Payout_debitEntryId_key";
DROP INDEX IF EXISTS "Payout_refundEntryId_key";
ALTER TABLE "Payout" DROP COLUMN IF EXISTS "debitEntryId";
ALTER TABLE "Payout" DROP COLUMN IF EXISTS "refundEntryId";

-- 5. SettlementReversal: drop walletEntryId
DROP INDEX IF EXISTS "SettlementReversal_walletEntryId_key";
ALTER TABLE "SettlementReversal" DROP COLUMN IF EXISTS "walletEntryId";

-- 6. PayoutSettlement join table
CREATE TABLE IF NOT EXISTS "PayoutSettlement" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayoutSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PayoutSettlement_settlementId_key" ON "PayoutSettlement"("settlementId");
CREATE INDEX IF NOT EXISTS "PayoutSettlement_payoutId_idx" ON "PayoutSettlement"("payoutId");
CREATE INDEX IF NOT EXISTS "PayoutSettlement_vendorId_idx" ON "PayoutSettlement"("vendorId");

DO $$ BEGIN
  ALTER TABLE "PayoutSettlement" ADD CONSTRAINT "PayoutSettlement_payoutId_fkey"
    FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PayoutSettlement" ADD CONSTRAINT "PayoutSettlement_settlementId_fkey"
    FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PayoutSettlement" ADD CONSTRAINT "PayoutSettlement_amount_positive" CHECK ("amount" > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Drop wallet immutability triggers + tables + enum
DROP TRIGGER IF EXISTS "wallet_entry_no_update" ON "WalletEntry";
DROP TRIGGER IF EXISTS "wallet_entry_no_delete" ON "WalletEntry";
DROP FUNCTION IF EXISTS "wallet_entry_immutable"();

DROP TABLE IF EXISTS "WalletEntry";
DROP TABLE IF EXISTS "Wallet";
DROP TYPE IF EXISTS "WalletEntryType";
