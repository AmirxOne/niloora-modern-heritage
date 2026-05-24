-- AlterTable
ALTER TABLE "User"
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "signupIpHash" TEXT,
ADD COLUMN "referredById" TEXT,
ADD COLUMN "referralCredit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralEarnedTotal" INTEGER NOT NULL DEFAULT 0;

-- Backfill referral code for existing users
UPDATE "User"
SET "referralCode" = UPPER(SUBSTRING(MD5("id"), 1, 8))
WHERE "referralCode" IS NULL;

-- Make referral code required and unique
ALTER TABLE "User"
ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- Create referral invite table
CREATE TABLE "ReferralInvite" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "referralCodeUsed" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "antiFraudReason" TEXT,
    "inviteeFirstOrderId" TEXT,
    "inviterReward" INTEGER NOT NULL DEFAULT 0,
    "inviteeReward" INTEGER NOT NULL DEFAULT 0,
    "inviteIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReferralInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralInvite_inviteeId_key" ON "ReferralInvite"("inviteeId");
CREATE INDEX "ReferralInvite_inviterId_createdAt_idx" ON "ReferralInvite"("inviterId", "createdAt");
CREATE INDEX "ReferralInvite_status_createdAt_idx" ON "ReferralInvite"("status", "createdAt");

ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_inviterId_fkey"
FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_inviteeId_fkey"
FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
