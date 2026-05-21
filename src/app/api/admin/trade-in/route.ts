import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseTradeInFilter } from "@/lib/server/trade-in/admin-trade-in";
import { toAdminTradeInDto } from "@/lib/server/trade-in/admin-trade-in-dto";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const statusFilter = parseTradeInFilter(searchParams.get("status"));

    const submissions = await prisma.tradeInSubmission.findMany({
      where: statusFilter === "all" ? undefined : { status: statusFilter },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok({ submissions: submissions.map(toAdminTradeInDto) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/trade-in" });
  }
}
