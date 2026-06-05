export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import {
  backInStockAlertAdminInclude,
  toAdminBackInStockAlertDto,
} from "@/lib/server/back-in-stock/admin-back-in-stock-dto";
import {
  isBackInStockStatus,
} from "@/lib/server/back-in-stock/back-in-stock";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status")?.trim() ?? "";
    const productId = searchParams.get("productId")?.trim() ?? "";
    const q = searchParams.get("q")?.trim() ?? "";

    const rows = await prisma.backInStockAlert.findMany({
      where: {
        ...(isBackInStockStatus(statusRaw) ? { status: statusRaw } : {}),
        ...(productId ? { productId } : {}),
        ...(q
          ? {
              OR: [
                { contact: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { product: { name: { contains: q, mode: "insensitive" } } },
                { product: { namePersian: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: backInStockAlertAdminInclude,
      orderBy: [{ requestedAt: "desc" }],
      take: 300,
    });

    return ok({ alerts: rows.map(toAdminBackInStockAlertDto) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/back-in-stock-alerts" });
  }
}
