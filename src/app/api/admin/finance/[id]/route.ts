export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { adminFinanceDetailSelect } from "@/lib/server/finance/admin-finance";
import { toAdminFinanceDetailDto } from "@/lib/server/finance/admin-finance-dto";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: adminFinanceDetailSelect,
    });
    if (!payment) return notFound("تراکنش یافت نشد.");

    return ok({ transaction: toAdminFinanceDetailDto(payment) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/finance/[id]" });
  }
}
