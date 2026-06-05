export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import {
  isCategoryForKind,
  isSupportRequestKind,
  normalizePhone,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_MESSAGE_MIN,
} from "@/lib/server/support-request/support-request";

type Body = {
  kind?: string;
  category?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
  orderId?: string;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const payload = (await request.json()) as Body;

    const kind = payload.kind?.trim() ?? "";
    const category = payload.category?.trim() ?? "";
    const fullName = payload.fullName?.trim() ?? "";
    const phone = normalizePhone(payload.phone ?? "");
    const email = payload.email?.trim() || null;
    const message = payload.message?.trim() ?? "";
    const orderIdRaw = payload.orderId?.trim() || null;

    if (!isSupportRequestKind(kind)) {
      return badRequest("نوع درخواست معتبر نیست.");
    }
    if (!isCategoryForKind(kind, category)) {
      return badRequest("دسته‌بندی درخواست معتبر نیست.");
    }
    if (!fullName || fullName.length < 2) {
      return badRequest("نام و نام خانوادگی را وارد کنید.");
    }
    if (!phone || phone.length < 10) {
      return badRequest("شماره موبایل معتبر وارد کنید.");
    }
    if (message.length < SUPPORT_MESSAGE_MIN || message.length > SUPPORT_MESSAGE_MAX) {
      return badRequest(
        `متن درخواست باید بین ${SUPPORT_MESSAGE_MIN.toLocaleString("fa-IR")} و ${SUPPORT_MESSAGE_MAX.toLocaleString("fa-IR")} کاراکتر باشد.`
      );
    }

    let orderId: string | null = orderIdRaw;
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });
      if (!order) {
        return badRequest("شماره سفارش یافت نشد.");
      }
      if (user && order.userId !== user.id) {
        return badRequest("این سفارش به حساب شما تعلق ندارد.");
      }
    }

    const row = await prisma.supportRequest.create({
      data: {
        userId: user?.id ?? null,
        orderId,
        kind,
        category,
        fullName,
        phone,
        email,
        message,
      },
    });

    return created({
      request: {
        id: row.id,
        kind: row.kind,
        category: row.category,
        fullName: row.fullName,
        phone: row.phone,
        email: row.email ?? undefined,
        message: row.message,
        orderId: row.orderId ?? undefined,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/support-requests" });
  }
}
