import type { Prisma } from "@prisma/client";
import type {
  AdminFinanceDetail,
  AdminFinanceSummary,
  AdminFinanceTransaction,
} from "@/lib/types";
import type { FinancePeriodSummary } from "@/lib/server/finance/admin-finance";
import { adminFinanceDetailSelect, adminFinancePaymentSelect } from "@/lib/server/finance/admin-finance";

type FinancePaymentRow = Prisma.PaymentGetPayload<{
  select: typeof adminFinancePaymentSelect;
}>;

type FinancePaymentDetailRow = Prisma.PaymentGetPayload<{
  select: typeof adminFinanceDetailSelect;
}>;

export function toAdminFinanceSummaryDto(summary: FinancePeriodSummary): AdminFinanceSummary {
  return summary;
}

export function toAdminFinanceTransactionDto(payment: FinancePaymentRow): AdminFinanceTransaction {
  return {
    id: payment.id,
    orderId: payment.orderId,
    gateway: payment.gateway,
    status: payment.status as AdminFinanceTransaction["status"],
    amountRial: payment.amountRial,
    orderTotal: payment.order.total,
    orderStatus: payment.order.status,
    orderType: payment.order.orderType,
    paymentMethod: payment.order.paymentMethod,
    refId: payment.refId,
    authority: payment.authority,
    createdAt: payment.createdAt.toISOString(),
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    customer: {
      id: payment.order.user.id,
      name: payment.order.user.name,
      phone: payment.order.user.phone,
    },
    itemCount: payment.order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function toAdminFinanceDetailDto(payment: FinancePaymentDetailRow): AdminFinanceDetail {
  return {
    ...toAdminFinanceTransactionDto(payment),
    cardPan: payment.cardPan,
    fee: payment.fee,
    errorCode: payment.errorCode,
    errorMessage: payment.errorMessage,
    updatedAt: payment.updatedAt.toISOString(),
    orderDate: payment.order.createdAt.toISOString(),
    items: payment.order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
    })),
    logs: payment.logs.map((log) => ({
      id: log.id,
      level: log.level,
      event: log.event,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
