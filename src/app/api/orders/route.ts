import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, serverError, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { orderInclude, toOrderDto } from "@/lib/server/orders/order-dto";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function parsePagination(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const rawPage = Number(searchParams.get("page") ?? "1");
  const rawPageSize = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1
      ? Math.min(MAX_PAGE_SIZE, Math.floor(rawPageSize))
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId: user.id },
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    return ok({
      orders: orders.map(toOrderDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/orders" });
  }
}

/**
 * ثبت مستقیم سفارش غیرفعال است — قیمت‌ها فقط سمت سرور در
 * `repriceOrderItems` (مسیر `POST /api/payments/zarinpal/request` → `createOrderFromCart`) محاسبه می‌شوند.
 */
export async function POST() {
  return badRequest(
    "ثبت سفارش فقط پس از پرداخت موفق از درگاه انجام می‌شود. از /api/payments/zarinpal/request استفاده کنید؛ قیمت سبد در کلاینت معتبر نیست."
  );
}
