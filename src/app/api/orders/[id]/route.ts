export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { notFound, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { orderInclude, toOrderDto } from "@/lib/server/orders/order-dto";
import { prisma } from "@/lib/server/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: orderInclude,
    });

    if (!order) return notFound("سفارش یافت نشد.");

    return ok({ order: toOrderDto(order) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/orders/[id]" });
  }
}
