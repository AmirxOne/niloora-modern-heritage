-- MML-3 Wallet Hardening Patch (financial correctness).
-- Additive/altering only, scoped to the Payments (wallet) domain:
--   * money columns -> BIGINT (avoid INT4 overflow)
--   * currency support on Wallet + WalletEntry
--   * per-wallet monotonic `sequence`
--   * non-negative balance CHECK
--   * append-only immutability enforced by a DB trigger

-- 1. Wallet: currency, BIGINT balance, monotonic sequence.
ALTER TABLE "Wallet" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'IRR';
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DATA TYPE BIGINT;
ALTER TABLE "Wallet" ADD COLUMN "sequence" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_balance_nonneg" CHECK ("balance" >= 0);

-- 2. WalletEntry: currency, BIGINT money, sequence (nullable during backfill).
ALTER TABLE "WalletEntry" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'IRR';
ALTER TABLE "WalletEntry" ALTER COLUMN "amount" SET DATA TYPE BIGINT;
ALTER TABLE "WalletEntry" ALTER COLUMN "balanceAfter" SET DATA TYPE BIGINT;
ALTER TABLE "WalletEntry" ADD COLUMN "sequence" BIGINT;

-- 3. Backfill per-wallet sequence from existing chronological order.
WITH ordered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "walletId"
            ORDER BY "createdAt" ASC, "id" ASC
        ) AS rn
    FROM "WalletEntry"
)
UPDATE "WalletEntry" e
SET "sequence" = o.rn
FROM ordered o
WHERE e."id" = o."id";

ALTER TABLE "WalletEntry" ALTER COLUMN "sequence" SET NOT NULL;

-- 4. Align each wallet's cursor with the highest entry sequence it owns.
UPDATE "Wallet" w
SET "sequence" = COALESCE(
    (SELECT MAX(e."sequence") FROM "WalletEntry" e WHERE e."walletId" = w."id"),
    0
);

-- 5. Enforce monotonic uniqueness of the ledger position per wallet.
CREATE UNIQUE INDEX "WalletEntry_walletId_sequence_key" ON "WalletEntry"("walletId", "sequence");

-- 6. Append-only immutability: forbid UPDATE and DELETE on the ledger.
CREATE OR REPLACE FUNCTION "wallet_entry_immutable"() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'WalletEntry is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "wallet_entry_no_update"
    BEFORE UPDATE ON "WalletEntry"
    FOR EACH ROW EXECUTE FUNCTION "wallet_entry_immutable"();

CREATE TRIGGER "wallet_entry_no_delete"
    BEFORE DELETE ON "WalletEntry"
    FOR EACH ROW EXECUTE FUNCTION "wallet_entry_immutable"();
