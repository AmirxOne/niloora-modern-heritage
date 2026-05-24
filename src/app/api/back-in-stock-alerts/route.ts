import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import {
  canCreateBackInStockAlert,
  isBackInStockChannel,
  normalizeBackInStockContact,
} from "@/lib/server/back-in-stock/back-in-stock";

type Body = {
  productId?: string;
  channel?: string;
  contact?: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const payload = (await request.json()) as Body;

    const productId = payload.productId?.trim() ?? "";
    const channelRaw = payload.channel?.trim() ?? "";
    const contactRaw = payload.contact?.trim() ?? "";
    const name = payload.name?.trim() || user?.name || null;

    if (!productId) {
      return badRequest("شناسه محصول الزامی است.");
    }
    if (!isBackInStockChannel(channelRaw)) {
      return badRequest("کانال اعلان نامعتبر است.");
    }
    const contact = normalizeBackInStockContact(channelRaw, contactRaw);
    if (!contact) {
      return badRequest(channelRaw === "sms" ? "شماره موبایل معتبر نیست." : "ایمیل معتبر نیست.");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, availability: true },
    });
    if (!product) {
      return badRequest("محصول یافت نشد.");
    }
    if (!canCreateBackInStockAlert(product.availability as "sold" | "preorder" | "ready")) {
      return badRequest("برای این وضعیت محصول امکان ثبت اعلان وجود ندارد.");
    }

    const alert = await prisma.backInStockAlert.upsert({
      where: {
        productId_channel_contact: {
          productId,
          channel: channelRaw,
          contact,
        },
      },
      create: {
        productId,
        userId: user?.id ?? null,
        name,
        channel: channelRaw,
        contact,
        sourceAvailability: product.availability,
        status: "pending",
      },
      update: {
        ...(user?.id ? { userId: user.id } : {}),
        name,
        sourceAvailability: product.availability,
        status: "pending",
        lastError: null,
      },
    });

    return created({
      alert: {
        id: alert.id,
        productId: alert.productId,
        channel: alert.channel,
        contact: alert.contact,
        status: alert.status,
        requestedAt: alert.requestedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/back-in-stock-alerts" });
  }
}
