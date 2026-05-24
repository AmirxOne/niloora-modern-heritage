import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { absoluteUrl } from "@/lib/seo/site";
import { serverEnv } from "@/lib/server/env";
import { sendAbandonedCartReminder } from "@/lib/server/notifications/abandoned-cart-notify";

export async function POST(request: Request) {
  try {
    const provided = request.headers.get("x-cron-secret")?.trim() ?? "";
    if (!serverEnv.abandonedCartCronSecret || provided !== serverEnv.abandonedCartCronSecret) {
      return unauthorized("forbidden");
    }

    if (!serverEnv.abandonedCartEnabled) {
      return badRequest("abandoned_cart_disabled");
    }

    const now = new Date();
    const rows = await prisma.abandonedCartRecovery.findMany({
      where: {
        status: "pending",
        nextReminderAt: { lte: now },
      },
      orderBy: { nextReminderAt: "asc" },
      take: 300,
    });

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      const recoverUrl = absoluteUrl(
        `${row.checkoutPath}${row.checkoutPath.includes("?") ? "&" : "?"}recovery=${encodeURIComponent(row.token)}`
      );

      const cartItems = Array.isArray(row.cartSnapshot) ? row.cartSnapshot : [];
      const result = await sendAbandonedCartReminder({
        channel: row.channel as "sms" | "email",
        contact: row.contact,
        name: row.name,
        recoverUrl,
        itemsCount: cartItems.length,
      });

      if (result.ok) {
        sent += 1;
        await prisma.abandonedCartRecovery.update({
          where: { id: row.id },
          data: {
            status: "sent",
            reminderSentAt: new Date(),
            reminderCount: { increment: 1 },
            lastError: null,
            nextReminderAt: null,
          },
        });
      } else {
        failed += 1;
        await prisma.abandonedCartRecovery.update({
          where: { id: row.id },
          data: {
            status: "failed",
            reminderCount: { increment: 1 },
            lastError: result.detail,
            nextReminderAt: new Date(now.getTime() + 60 * 60 * 1000),
          },
        });
      }
    }

    return ok({ processed: rows.length, sent, failed });
  } catch (error) {
    return handleRouteError(error, { route: "/api/cron/abandoned-cart-recovery" });
  }
}
