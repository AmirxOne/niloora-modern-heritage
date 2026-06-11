import { prisma } from "@/lib/server/prisma";
import { sendBackInStockNotification } from "@/lib/server/notifications/back-in-stock-notify";
import { absoluteUrl } from "@/lib/seo/site";

export type BackInStockDispatchResult = {
  sent: number;
  failed: number;
  total: number;
};

/**
 * Send back-in-stock notifications for the matching pending/failed alerts and
 * update their status. Shared by the manual admin "notify" endpoint and the
 * automatic trigger that fires when a product becomes purchasable again, so the
 * notification logic lives in exactly one place.
 */
export async function dispatchBackInStockAlerts(filter: {
  alertIds?: string[];
  productId?: string;
}): Promise<BackInStockDispatchResult> {
  const alertIds = Array.isArray(filter.alertIds)
    ? filter.alertIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const productId = filter.productId?.trim();

  if (alertIds.length === 0 && !productId) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const alerts = await prisma.backInStockAlert.findMany({
    where: {
      ...(alertIds.length > 0 ? { id: { in: alertIds } } : {}),
      ...(productId ? { productId } : {}),
      status: { in: ["pending", "failed"] },
    },
    include: {
      product: {
        select: { id: true, name: true, namePersian: true, availability: true },
      },
    },
    take: 500,
  });

  let sent = 0;
  let failed = 0;

  for (const alert of alerts) {
    const productTitle = alert.product.namePersian || alert.product.name;
    const productUrl = absoluteUrl(`/product/${encodeURIComponent(alert.product.id)}`);
    const result = await sendBackInStockNotification({
      channel: alert.channel as "sms" | "email",
      contact: alert.contact,
      productName: productTitle,
      productId: alert.product.id,
      productUrl,
    });

    if (result.ok) {
      sent += 1;
      await prisma.backInStockAlert.update({
        where: { id: alert.id },
        data: {
          status: "sent",
          notifiedAt: new Date(),
          notifyAttempts: { increment: 1 },
          lastError: null,
        },
      });
    } else {
      failed += 1;
      await prisma.backInStockAlert.update({
        where: { id: alert.id },
        data: {
          status: "failed",
          notifyAttempts: { increment: 1 },
          lastError: result.detail,
        },
      });
    }
  }

  return { sent, failed, total: alerts.length };
}
