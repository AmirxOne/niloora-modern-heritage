-- CreateTable
CREATE TABLE "CustomizerQuoteRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending-quote',
    "title" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "estimateTotal" INTEGER NOT NULL,
    "customerNote" TEXT,
    "quotedTotal" INTEGER,
    "workshopReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomizerQuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomizerQuoteRequest_userId_createdAt_idx" ON "CustomizerQuoteRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomizerQuoteRequest_status_idx" ON "CustomizerQuoteRequest"("status");

-- AddForeignKey
ALTER TABLE "CustomizerQuoteRequest" ADD CONSTRAINT "CustomizerQuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
