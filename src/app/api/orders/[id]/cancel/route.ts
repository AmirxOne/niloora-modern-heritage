import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { cancelOrderByCustomer } from "@/lib/server/orders/cancel-order";
import { prisma } from "@/lib/server/prisma";
import { orderInclude, toOrderDto } from "@/lib/server/orders/order-dto";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Customer-initiated cancellation. Allowed only while the order has not
 * entered crafting/shipping. Paid orders go to refund_pending and the money
 * is returned manually by the gallery (recorded in the admin panel).
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const { id } = await context.params;
    if (!id?.trim()) return badRequest("شناسه سفارش الزامی است.");

    const result = await cancelOrderByCustomer(id, user.id);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return badRequest("سفارش یافت نشد.");
      }
      if (result.reason === "already_cancelled") {
        return badRequest("این سفارش قبلاً لغو شده است.");
      }
      return badRequest(
        "این سفارش در مرحلهٔ ساخت یا ارسال است و قابل لغو نیست. برای بازگشت کالا از بخش پشتیبانی درخواست ثبت کنید."
      );
    }

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: orderInclude,
    });

    return ok({
      order: order ? toOrderDto(order) : null,
      refund: result.refunded,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/orders/[id]/cancel" });
  }
}
