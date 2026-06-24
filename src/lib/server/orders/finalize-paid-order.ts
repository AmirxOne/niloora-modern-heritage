import type { Prisma } from "@prisma/client";
import type { Order, OrderItem } from "@prisma/client";
import {
  commitInventoryForPaidOrder,
  InventoryCommitError,
} from "@/lib/server/inventory/commit-order-inventory";
import { consumeGiftCardForOrder, createGiftCard } from "@/lib/server/gift-card/gift-card-service";
import { rewardLoyaltyOnPaidOrder } from "@/lib/server/loyalty/loyalty";
import { scheduleOrderMaintenanceReminders } from "@/lib/server/notifications/maintenance-reminders";
import { rewardReferralOnPaidOrder } from "@/lib/server/referral/referral";
import { ORDER_STATUS } from "@/lib/server/commerce/statuses";
import { createLedgerEntriesForPaidOrder } from "@/lib/server/marketplace/ledger/create-ledger-entries-for-paid-order";
import { logPaymentEvent } from "@/lib/server/payment/log";

type PrismaTx = Prisma.TransactionClient;

export type OrderForFinalization = Order & { items: OrderItem[] };

export type FinalizePaidOrderResult = {
  alreadyFinalized: boolean;
  inventoryCommitted: boolean;
  inventoryDeferred: boolean;
};

async function logInventoryDeferral(orderId: string, error: InventoryCommitError) {
  await logPaymentEvent({
    orderId,
    level: "error",
    event: "inventory.commit.deferred",
    message: error.message,
    meta: { code: error.code, productId: error.productId },
  });
}

export async function finalizePaidOrder(
  tx: PrismaTx,
  order: OrderForFinalization
): Promise<FinalizePaidOrderResult> {
  const current = await tx.order.findUnique({
    where: { id: order.id },
    select: {
      finalizedAt: true,
      inventoryCommittedAt: true,
      orderType: true,
    },
  });

  if (current?.finalizedAt) {
    return {
      alreadyFinalized: true,
      inventoryCommitted: Boolean(current.inventoryCommittedAt),
      inventoryDeferred: current.orderType === "product" && !current.inventoryCommittedAt,
    };
  }

  let inventoryCommitted = Boolean(current?.inventoryCommittedAt);
  let inventoryDeferred = false;

  if (order.orderType === "product" && !inventoryCommitted) {
    try {
      await commitInventoryForPaidOrder(tx, order.items, order.id);
      inventoryCommitted = true;
    } catch (error) {
      if (error instanceof InventoryCommitError) {
        inventoryDeferred = true;
        await logInventoryDeferral(order.id, error);
      } else {
        throw error;
      }
    }
  }

  const claim = await tx.order.updateMany({
    where: { id: order.id, finalizedAt: null },
    data: {
      status: ORDER_STATUS.processing,
      loyaltyPointsEarned: order.loyaltyPointsEarned ?? 0,
      finalizedAt: new Date(),
      ...(inventoryCommitted ? { inventoryCommittedAt: new Date() } : {}),
    },
  });

  if (claim.count === 0) {
    const finalized = await tx.order.findUnique({
      where: { id: order.id },
      select: { inventoryCommittedAt: true, finalizedAt: true, orderType: true },
    });
    return {
      alreadyFinalized: true,
      inventoryCommitted: Boolean(finalized?.inventoryCommittedAt),
      inventoryDeferred:
        finalized?.orderType === "product" && !finalized?.inventoryCommittedAt,
    };
  }

  if (order.giftCardCode && (order.giftCardAppliedAmount ?? 0) > 0) {
    await consumeGiftCardForOrder({
      code: order.giftCardCode,
      orderId: order.id,
      amount: order.giftCardAppliedAmount ?? 0,
      tx,
    });
  }

  if (order.orderType === "gift-card" && (order.giftCardPurchaseAmount ?? 0) > 0) {
    await createGiftCard({
      amount: order.giftCardPurchaseAmount ?? 0,
      purchaserUserId: order.userId,
      orderId: order.id,
      recipientName: order.giftCardRecipientName ?? null,
      recipientContact: order.giftCardRecipientContact ?? null,
      note: "Gift card purchased online",
      tx,
    });
  }

  if (order.promoCode) {
    await tx.promoCode.updateMany({
      where: { code: order.promoCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  await rewardReferralOnPaidOrder(tx, order.id);
  await rewardLoyaltyOnPaidOrder(tx, order.id);
  await scheduleOrderMaintenanceReminders(tx, order.id);
  await createLedgerEntriesForPaidOrder(tx, order);

  return {
    alreadyFinalized: false,
    inventoryCommitted,
    inventoryDeferred,
  };
}
