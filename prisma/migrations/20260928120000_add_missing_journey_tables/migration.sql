-- Create missing notification/journey tables that were present in schema.prisma
-- but never had a migration. Without them, finalizePaidOrder crashes on every
-- successful payment callback (maintenanceReminder.upsert → P2021).

CREATE TABLE IF NOT EXISTS "AutomatedJourneyEvent" (
    "id" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "userId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "AutomatedJourneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AutomatedJourneyEvent_journey_channel_fingerprint_key" ON "AutomatedJourneyEvent"("journey", "channel", "fingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomatedJourneyEvent_journey_status_createdAt_idx" ON "AutomatedJourneyEvent"("journey", "status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomatedJourneyEvent_userId_createdAt_idx" ON "AutomatedJourneyEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomatedJourneyEvent_orderId_createdAt_idx" ON "AutomatedJourneyEvent"("orderId", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "AutomatedJourneyEvent" ADD CONSTRAINT "AutomatedJourneyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "AutomatedJourneyEvent" ADD CONSTRAINT "AutomatedJourneyEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MaintenanceReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "notifyAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceReminder_orderId_kind_channel_key" ON "MaintenanceReminder"("orderId", "kind", "channel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MaintenanceReminder_status_dueAt_idx" ON "MaintenanceReminder"("status", "dueAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MaintenanceReminder_userId_dueAt_idx" ON "MaintenanceReminder"("userId", "dueAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "MaintenanceReminder" ADD CONSTRAINT "MaintenanceReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "MaintenanceReminder" ADD CONSTRAINT "MaintenanceReminder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PriceDropUnsubscribeToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceDropUnsubscribeToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PriceDropUnsubscribeToken_token_key" ON "PriceDropUnsubscribeToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PriceDropUnsubscribeToken_userId_channel_contact_key" ON "PriceDropUnsubscribeToken"("userId", "channel", "contact");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PriceDropUnsubscribeToken_userId_active_idx" ON "PriceDropUnsubscribeToken"("userId", "active");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "PriceDropUnsubscribeToken" ADD CONSTRAINT "PriceDropUnsubscribeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
