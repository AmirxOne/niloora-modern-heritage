import type { AdminHomeKpiDto } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";

const SUCCESS_ORDER_STATUSES = ["processing", "crafting", "shipped", "delivered"] as const;

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

function toIsoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function weekStart(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function ymdLabel(date: Date): string {
  return date.toLocaleDateString("fa-IR", { month: "2-digit", day: "2-digit" });
}

function ymLabel(date: Date): string {
  return date.toLocaleDateString("fa-IR", { year: "numeric", month: "short" });
}

function roundPercent(value: number): number {
  return Number(value.toFixed(1));
}

function sumByRange(
  source: Array<{ createdAt: Date; total: number }>,
  startInclusive: Date,
  endExclusive: Date
): number {
  return source.reduce((acc, item) => {
    if (item.createdAt >= startInclusive && item.createdAt < endExclusive) return acc + item.total;
    return acc;
  }, 0);
}

export async function getAdminHomeKpis(now = new Date()): Promise<AdminHomeKpiDto> {
  const day0 = startOfDay(now);
  const day30Ago = addDays(day0, -29);
  const week0 = weekStart(now);
  const week11Ago = addDays(week0, -7 * 11);
  const month0 = monthStart(now);
  const month11Ago = new Date(month0.getFullYear(), month0.getMonth() - 11, 1);

  const [attemptedOrders, successfulOrdersRows, stoneRows] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: { in: [...SUCCESS_ORDER_STATUSES] } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { status: { in: [...SUCCESS_ORDER_STATUSES] } },
      },
      select: {
        quantity: true,
        price: true,
        product: {
          select: {
            stone: true,
          },
        },
      },
    }),
  ]);

  const successfulOrders = successfulOrdersRows.length;
  const totalRevenue = successfulOrdersRows.reduce((sum, row) => sum + row.total, 0);
  const conversionRatePercent =
    attemptedOrders > 0 ? roundPercent((successfulOrders / attemptedOrders) * 100) : 0;
  const averageBasketValue = successfulOrders > 0 ? Math.round(totalRevenue / successfulOrders) : 0;

  const salesToday = sumByRange(successfulOrdersRows, day0, addDays(day0, 1));
  const salesWeek = sumByRange(successfulOrdersRows, week0, addDays(week0, 7));
  const salesMonth = sumByRange(
    successfulOrdersRows,
    month0,
    new Date(month0.getFullYear(), month0.getMonth() + 1, 1)
  );

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const d = addDays(day30Ago, i);
    dailyMap.set(toIsoDateKey(d), 0);
  }
  for (const row of successfulOrdersRows) {
    if (row.createdAt < day30Ago) continue;
    const key = toIsoDateKey(startOfDay(row.createdAt));
    if (!dailyMap.has(key)) continue;
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + row.total);
  }
  const dailySales = Array.from(dailyMap.entries()).map(([key, value]) => ({
    label: ymdLabel(new Date(`${key}T00:00:00.000Z`)),
    value,
  }));

  const weeklyMap = new Map<string, { label: string; value: number }>();
  for (let i = 0; i < 12; i += 1) {
    const start = addDays(week11Ago, i * 7);
    const key = toIsoDateKey(start);
    weeklyMap.set(key, { label: ymdLabel(start), value: 0 });
  }
  for (const row of successfulOrdersRows) {
    const start = weekStart(row.createdAt);
    const key = toIsoDateKey(start);
    if (!weeklyMap.has(key)) continue;
    const prev = weeklyMap.get(key)!;
    weeklyMap.set(key, { ...prev, value: prev.value + row.total });
  }
  const weeklySales = Array.from(weeklyMap.values());

  const monthlyMap = new Map<string, { label: string; value: number }>();
  for (let i = 0; i < 12; i += 1) {
    const start = new Date(month11Ago.getFullYear(), month11Ago.getMonth() + i, 1);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { label: ymLabel(start), value: 0 });
  }
  for (const row of successfulOrdersRows) {
    const start = monthStart(row.createdAt);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) continue;
    const prev = monthlyMap.get(key)!;
    monthlyMap.set(key, { ...prev, value: prev.value + row.total });
  }
  const monthlySales = Array.from(monthlyMap.values());

  const stoneMap = new Map<string, { quantity: number; revenue: number }>();
  for (const row of stoneRows) {
    const stone = row.product?.stone?.trim() || "نامشخص";
    const prev = stoneMap.get(stone) ?? { quantity: 0, revenue: 0 };
    stoneMap.set(stone, {
      quantity: prev.quantity + row.quantity,
      revenue: prev.revenue + row.price * row.quantity,
    });
  }
  const stoneSales = Array.from(stoneMap.entries())
    .map(([stone, values]) => ({ stone, quantity: values.quantity, revenue: values.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return {
    conversionRatePercent,
    averageBasketValue,
    successfulOrders,
    attemptedOrders,
    salesToday,
    salesWeek,
    salesMonth,
    dailySales,
    weeklySales,
    monthlySales,
    stoneSales,
  };
}
