import { prisma } from "@/lib/server/prisma";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

export async function GET() {
  try {
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
      },
      _sum: {
        quantity: true,
      },
    });

    const byProductId: Record<string, number> = {};
    for (const row of grouped) {
      if (!row.productId) continue;
      byProductId[row.productId] = row._sum.quantity ?? 0;
    }

    return ok({ byProductId });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/sales" });
  }
}
