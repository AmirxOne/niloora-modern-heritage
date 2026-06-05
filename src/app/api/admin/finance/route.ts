export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import {
  adminFinancePaymentSelect,
  buildPaymentWhere,
  getFinanceSummary,
  parseFinanceListFilters,
} from "@/lib/server/finance/admin-finance";
import {
  toAdminFinanceSummaryDto,
  toAdminFinanceTransactionDto,
} from "@/lib/server/finance/admin-finance-dto";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const filters = parseFinanceListFilters(searchParams);
    const where = buildPaymentWhere(filters);

    const [summary, total, payments] = await Promise.all([
      getFinanceSummary(filters),
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        select: adminFinancePaymentSelect,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    return ok({
      summary: toAdminFinanceSummaryDto(summary),
      transactions: payments.map(toAdminFinanceTransactionDto),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/finance" });
  }
}
