-- Order finalization tracking for payment idempotency and inventory retry (Phase 0).
ALTER TABLE "Order" ADD COLUMN "inventoryCommittedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "finalizedAt" TIMESTAMP(3);

CREATE INDEX "Order_status_inventoryCommittedAt_idx" ON "Order"("status", "inventoryCommittedAt");

-- Tie inventory movements to orders/returns for audit and idempotent restock.
ALTER TABLE "InventoryLog" ADD COLUMN "orderId" TEXT;
ALTER TABLE "InventoryLog" ADD COLUMN "orderReturnId" TEXT;

CREATE INDEX "InventoryLog_orderId_idx" ON "InventoryLog"("orderId");

CREATE UNIQUE INDEX "InventoryLog_orderReturnId_productId_key" ON "InventoryLog"("orderReturnId", "productId");
