import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { notFound, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getSellerOverview } from "@/lib/server/sellers/seller-service";

/**
 * Seller's own shop overview — stats + ledger balance.
 * Works while pending/suspended too (read-only self view).
 */
export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) return notFound("فروشگاهی برای این حساب ثبت نشده است.");

    const overview = await getSellerOverview(seller.id);
    if (!overview) return notFound("فروشگاه یافت نشد.");

    return ok(overview);
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/overview" });
  }
}
