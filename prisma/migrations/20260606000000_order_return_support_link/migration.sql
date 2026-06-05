-- Link structured customer returns to support intake tickets
ALTER TABLE "OrderReturn" ADD COLUMN IF NOT EXISTS "supportRequestId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "OrderReturn_supportRequestId_key" ON "OrderReturn"("supportRequestId");

DO $$ BEGIN
 ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
