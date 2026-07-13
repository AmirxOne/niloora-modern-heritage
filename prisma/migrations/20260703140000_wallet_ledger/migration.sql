-- MML-3: Unified Wallet / Credit Ledger (additive).
-- Introduces an append-only wallet ledger as the source of truth for store credit,
-- and backfills existing per-user referral credit balances into it.

CREATE TYPE "WalletEntryType" AS ENUM ('credit', 'debit', 'adjustment');

CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

CREATE INDEX "Wallet_balance_idx" ON "Wallet"("balance");

CREATE TABLE "WalletEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "source" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "orderId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WalletEntry_idempotencyKey_key" ON "WalletEntry"("idempotencyKey");

CREATE INDEX "WalletEntry_walletId_createdAt_idx" ON "WalletEntry"("walletId", "createdAt");

CREATE INDEX "WalletEntry_userId_createdAt_idx" ON "WalletEntry"("userId", "createdAt");

CREATE INDEX "WalletEntry_orderId_idx" ON "WalletEntry"("orderId");

CREATE INDEX "WalletEntry_source_createdAt_idx" ON "WalletEntry"("source", "createdAt");

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: create a wallet for every user that currently holds referral credit,
-- with an opening ledger entry equal to that balance. Idempotent via the unique
-- idempotencyKey ("migration:referral-credit:<userId>").
INSERT INTO "Wallet" ("id", "userId", "balance", "createdAt", "updatedAt")
SELECT
    'wal_' || "id",
    "id",
    "referralCredit",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "referralCredit" > 0
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "WalletEntry" (
    "id",
    "walletId",
    "userId",
    "amount",
    "balanceAfter",
    "type",
    "source",
    "referenceType",
    "referenceId",
    "idempotencyKey",
    "description",
    "createdAt"
)
SELECT
    'wen_' || u."id",
    w."id",
    u."id",
    u."referralCredit",
    u."referralCredit",
    'credit',
    'migration',
    'user',
    u."id",
    'migration:referral-credit:' || u."id",
    'Opening balance migrated from referral credit',
    CURRENT_TIMESTAMP
FROM "User" u
JOIN "Wallet" w ON w."userId" = u."id"
WHERE u."referralCredit" > 0
ON CONFLICT ("idempotencyKey") DO NOTHING;
