import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminOrderFilter } from "@/lib/server/orders/admin-order";
import { toAdminOrderDto } from "@/lib/server/orders/admin-order-dto";
import { orderInclude } from "@/lib/server/orders/order-dto";
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
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok({ orders: orders.map(toAdminOrderDto) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders" });
  }
}
