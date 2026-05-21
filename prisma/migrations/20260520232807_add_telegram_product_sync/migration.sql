-- CreateTable
CREATE TABLE "TelegramProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "tags" JSONB NOT NULL,
    "attributes" JSONB NOT NULL,
    "images" JSONB NOT NULL,
    "telegramMessageId" INTEGER NOT NULL,
    "telegramDate" TIMESTAMP(3) NOT NULL,
    "sourceChannel" TEXT NOT NULL,
    "rawText" TEXT,
    "hasMedia" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSyncState" (
    "channel" TEXT NOT NULL,
    "lastMessageId" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "listenerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSyncState_pkey" PRIMARY KEY ("channel")
);

-- CreateIndex
CREATE INDEX "TelegramProduct_sourceChannel_telegramDate_idx" ON "TelegramProduct"("sourceChannel", "telegramDate");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramProduct_sourceChannel_telegramMessageId_key" ON "TelegramProduct"("sourceChannel", "telegramMessageId");
