export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { sendBackInStockNotification } from "@/lib/server/notifications/back-in-stock-notify";
import { absoluteUrl } from "@/lib/seo/site";

type Body = {
  alertIds?: string[];
  productId?: string;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const payload = (await request.json()) as Body;
    const alertIds = Array.isArray(payload.alertIds) ? payload.alertIds.map((id) => String(id).trim()).filter(Boolean) : [];
    const productId = payload.productId?.trim();

    if (alertIds.length === 0 && !productId) {
      return badRequest("شناسه اعلان یا شناسه محصول را ارسال کنید.");
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

    // اگر محصول آماده/سفارشی شد، اعلان‌های باقی‌مانده را کنسل نکنیم چون ممکن است بخواهند دستی دوباره ارسال شود.
    return ok({
      sent,
      failed,
      total: alerts.length,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/back-in-stock-alerts/notify" });
  }
}
