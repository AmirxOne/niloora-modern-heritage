import type { Order, OrderItem, PrismaClient } from "@prisma/client";
import { commitInventoryForPaidOrder } from "@/lib/server/inventory/commit-order-inventory";
import { consumeGiftCardForOrder, createGiftCard } from "@/lib/server/gift-card/gift-card-service";
import { rewardLoyaltyOnPaidOrder } from "@/lib/server/loyalty/loyalty";
import { scheduleOrderMaintenanceReminders } from "@/lib/server/notifications/maintenance-reminders";
import { rewardReferralOnPaidOrder } from "@/lib/server/referral/referral";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export type OrderForFinalization = Order & { items: OrderItem[] };

export async function finalizePaidOrder(
  tx: PrismaTx,
  order: OrderForFinalization
): Promise<void> {
  if (order.orderType === "product") {
    await commitInventoryForPaidOrder(tx, order.items);
  }

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: "processing",
      loyaltyPointsEarned: order.loyaltyPointsEarned ?? 0,
    },
  });

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

  await rewardReferralOnPaidOrder(tx, order.id);
  await rewardLoyaltyOnPaidOrder(tx, order.id);
  await scheduleOrderMaintenanceReminders(tx, order.id);
}
