export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminOrderFilter } from "@/lib/server/orders/admin-order";
import { toAdminOrderListItemDto } from "@/lib/server/orders/admin-order-dto";
import { orderInclude } from "@/lib/server/orders/order-dto";
import { loadOrderReturnSummariesByOrderIds } from "@/lib/server/returns/order-return-service";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const statusFilter = parseAdminOrderFilter(searchParams.get("status"));

    const orders = await prisma.order.findMany({
      where: statusFilter === "all" ? undefined : { status: statusFilter },
      include: {
        ...orderInclude,
        user: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const returnMap = await loadOrderReturnSummariesByOrderIds(orders.map((o) => o.id));

    return ok({
      orders: orders.map((order) =>
        toAdminOrderListItemDto(order, returnMap.get(order.id) ?? [])
      ),
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders" });
  }
}
