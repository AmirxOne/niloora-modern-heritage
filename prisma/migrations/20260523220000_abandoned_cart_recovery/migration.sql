-- CreateTable
CREATE TABLE "AbandonedCartRecovery" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "channel" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cartSnapshot" JSONB NOT NULL,
    "shippingSnapshot" JSONB,
    "checkoutPath" TEXT NOT NULL DEFAULT '/cart?step=checkout',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReminderAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "recoveredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCartRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCartRecovery_token_key" ON "AbandonedCartRecovery"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCartRecovery_channel_contact_key" ON "AbandonedCartRecovery"("channel", "contact");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_status_lastActivityAt_idx" ON "AbandonedCartRecovery"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_status_nextReminderAt_idx" ON "AbandonedCartRecovery"("status", "nextReminderAt");

-- CreateIndex
CREATE INDEX "AbandonedCartRecovery_userId_updatedAt_idx" ON "AbandonedCartRecovery"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "AbandonedCartRecovery" ADD CONSTRAINT "AbandonedCartRecovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
