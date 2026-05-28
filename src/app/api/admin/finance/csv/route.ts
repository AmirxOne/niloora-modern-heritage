import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { handleRouteError } from "@/lib/server/route-errors";
import { excelResponse, serializeExcelBuffer } from "@/lib/server/excel";
import { prisma } from "@/lib/server/prisma";
import {
  adminFinancePaymentSelect,
  buildPaymentWhere,
  parseFinanceListFilters,
} from "@/lib/server/finance/admin-finance";
import { toAdminFinanceTransactionDto } from "@/lib/server/finance/admin-finance-dto";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const filters = parseFinanceListFilters(searchParams);
    const where = buildPaymentWhere(filters);

    const payments = await prisma.payment.findMany({
      where,
      select: adminFinancePaymentSelect,
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const rows = payments.map((payment) => {
      const dto = toAdminFinanceTransactionDto(payment);
      return {
        paymentId: dto.id,
        orderId: dto.orderId,
        status: dto.status,
        gateway: dto.gateway,
        amountRial: dto.amountRial,
        orderTotal: dto.orderTotal,
        refId: dto.refId ?? "",
        authority: dto.authority ?? "",
        customerName: dto.customer.name,
        customerPhone: dto.customer.phone,
        itemCount: dto.itemCount,
        createdAt: dto.createdAt,
        verifiedAt: dto.verifiedAt ?? "",
      };
    });

    return excelResponse(
      "finance-transactions.xlsx",
      serializeExcelBuffer(
        [
          "paymentId",
          "orderId",
          "status",
          "gateway",
          "amountRial",
          "orderTotal",
          "refId",
          "authority",
          "customerName",
          "customerPhone",
          "itemCount",
          "createdAt",
          "verifiedAt",
        ],
        rows
      )
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/finance/csv" });
  }
}
