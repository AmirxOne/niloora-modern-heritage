import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

export const ADMIN_PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;
export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];
export type AdminPaymentFilterStatus = AdminPaymentStatus | "all";

export function parseAdminPaymentFilter(raw: string | null): AdminPaymentFilterStatus {
  if (raw === "pending" || raw === "paid" || raw === "failed") return raw;
  return "all";
}

export function parseFinancePage(raw: string | null): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

export function parseFinancePageSize(raw: string | null): number {
  const n = Number.parseInt(raw ?? "20", 10);
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(n, 100);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function parseDateParam(raw: string | null, endOfDay = false): Date | null {
  if (!raw?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

export type FinanceListFilters = {
  status: AdminPaymentFilterStatus;
  from: Date | null;
  to: Date | null;
  page: number;
  pageSize: number;
};

export function parseFinanceListFilters(searchParams: URLSearchParams): FinanceListFilters {
  return {
    status: parseAdminPaymentFilter(searchParams.get("status")),
    from: parseDateParam(searchParams.get("from")),
    to: parseDateParam(searchParams.get("to"), true),
    page: parseFinancePage(searchParams.get("page")),
    pageSize: parseFinancePageSize(searchParams.get("pageSize")),
  };
}

export function buildPaymentWhere(filters: FinanceListFilters): Prisma.PaymentWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.from) createdAt.gte = filters.from;
  if (filters.to) createdAt.lte = filters.to;

  return {
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.from || filters.to ? { createdAt } : {}),
  };
}

export type FinancePeriodSummary = {
  totalRevenue: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageBasket: number;
};

export async function getFinanceSummary(
  filters: FinanceListFilters,
  now = new Date()
): Promise<FinancePeriodSummary> {
  const where = buildPaymentWhere(filters);

  const day0 = startOfDay(now);
  const week0 = (() => {
    const d = startOfDay(now);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
  })();
  const month0 = new Date(now.getFullYear(), now.getMonth(), 1);

  const [filteredAgg, paidRows] = await Promise.all([
    prisma.payment.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
    prisma.payment.findMany({
      where: { status: "paid" },
      select: {
        createdAt: true,
        verifiedAt: true,
        order: { select: { total: true } },
      },
    }),
  ]);

  let successfulPayments = 0;
  let failedPayments = 0;
  let pendingPayments = 0;
  for (const row of filteredAgg) {
    if (row.status === "paid") successfulPayments = row._count.id;
    else if (row.status === "failed") failedPayments = row._count.id;
    else if (row.status === "pending") pendingPayments = row._count.id;
  }

  const paidInFilter = await prisma.payment.findMany({
    where: { ...where, status: "paid" },
    select: { order: { select: { total: true } } },
  });
  const totalRevenue = paidInFilter.reduce((sum, p) => sum + p.order.total, 0);
  const averageBasket =
    successfulPayments > 0 ? Math.round(totalRevenue / successfulPayments) : 0;

  const eventDate = (row: { verifiedAt: Date | null; createdAt: Date }) =>
    row.verifiedAt ?? row.createdAt;

  const revenueToday = paidRows.reduce((sum, row) => {
    const at = eventDate(row);
    if (at >= day0 && at < addDays(day0, 1)) return sum + row.order.total;
    return sum;
  }, 0);

  const revenueWeek = paidRows.reduce((sum, row) => {
    const at = eventDate(row);
    if (at >= week0 && at < addDays(week0, 7)) return sum + row.order.total;
    return sum;
  }, 0);

  const revenueMonth = paidRows.reduce((sum, row) => {
    const at = eventDate(row);
    const monthEnd = new Date(month0.getFullYear(), month0.getMonth() + 1, 1);
    if (at >= month0 && at < monthEnd) return sum + row.order.total;
    return sum;
  }, 0);

  return {
    totalRevenue,
    revenueToday,
    revenueWeek,
    revenueMonth,
    successfulPayments,
    failedPayments,
    pendingPayments,
    averageBasket,
  };
}

export const adminFinancePaymentSelect = {
  id: true,
  orderId: true,
  gateway: true,
  authority: true,
  amountRial: true,
  status: true,
  refId: true,
  cardPan: true,
  fee: true,
  errorCode: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  order: {
    select: {
      id: true,
      status: true,
      total: true,
      orderType: true,
      paymentMethod: true,
      createdAt: true,
      user: { select: { id: true, name: true, phone: true } },
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

export const adminFinanceDetailSelect = {
  ...adminFinancePaymentSelect,
  logs: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    select: {
      id: true,
      level: true,
      event: true,
      message: true,
      meta: true,
      createdAt: true,
    },
  },
} satisfies Prisma.PaymentSelect;
