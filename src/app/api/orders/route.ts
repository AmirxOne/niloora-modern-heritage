export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { orderInclude, toOrderDto } from "@/lib/server/orders/order-dto";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return ok({ orders: orders.map(toOrderDto) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/orders" });
  }
}

/**
 * ثبت مستقیم سفارش غیرفعال است — قیمت‌ها فقط سمت سرور در
 * `repriceOrderItems` (مسیر `POST /api/payments/zarinpal/request` → `createOrderFromCart`) محاسبه می‌شوند.
 */
export async function POST() {
  return badRequest(
    "ثبت سفارش فقط پس از پرداخت موفق از درگاه انجام می‌شود. از /api/payments/zarinpal/request استفاده کنید؛ قیمت سبد در کلاینت معتبر نیست."
  );
}
