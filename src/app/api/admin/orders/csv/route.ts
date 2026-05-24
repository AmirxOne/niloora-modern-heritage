import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok, badRequest } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseCsv, serializeCsv } from "@/lib/server/csv";
import { ADMIN_ORDER_STATUSES, isAdminSettableStatus } from "@/lib/server/orders/admin-order";
import { prisma } from "@/lib/server/prisma";
import { orderInclude } from "@/lib/server/orders/order-dto";
import { toAdminOrderDto } from "@/lib/server/orders/admin-order-dto";

function csvResponse(filename: string, content: string): Response {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const orders = await prisma.order.findMany({
      include: {
        ...orderInclude,
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const rows = orders.map((order) => {
      const dto = toAdminOrderDto(order);
      return {
        id: dto.id,
        status: dto.status,
        trackingCode: dto.trackingCode ?? "",
        total: dto.total,
        date: dto.date,
        customerName: dto.customer.name,
        customerPhone: dto.customer.phone,
        itemsCount: dto.items.reduce((sum, item) => sum + item.quantity, 0),
      };
    });
    return csvResponse(
      "orders.csv",
      serializeCsv(
        ["id", "status", "trackingCode", "total", "date", "customerName", "customerPhone", "itemsCount"],
        rows
      )
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders/csv" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const csvText = await request.text();
    const { rows } = parseCsv(csvText);
    if (rows.length === 0) return badRequest("CSV خالی است.");

    const errors: Array<{ row: number; id?: string; message: string }> = [];
    let updated = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 2;
      const id = row.id?.trim();
      if (!id) {
        errors.push({ row: rowNo, message: "id الزامی است." });
        continue;
      }

      const nextStatus = row.status?.trim();
      const nextTracking = row.trackingCode?.trim();
      if (!nextStatus && nextTracking === undefined) {
        errors.push({ row: rowNo, id, message: "حداقل یکی از status یا trackingCode لازم است." });
        continue;
      }

      if (nextStatus && !isAdminSettableStatus(nextStatus)) {
        errors.push({
          row: rowNo,
          id,
          message: `status نامعتبر است. مقادیر مجاز: ${ADMIN_ORDER_STATUSES.join(", ")}`,
        });
        continue;
      }

      try {
        const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
          errors.push({ row: rowNo, id, message: "سفارش یافت نشد." });
          continue;
        }

        await prisma.order.update({
          where: { id },
          data: {
            ...(nextStatus ? { status: nextStatus } : {}),
            ...(row.trackingCode !== undefined ? { trackingCode: nextTracking || null } : {}),
          },
        });
        updated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "خطای نامشخص";
        errors.push({ row: rowNo, id, message });
      }
    }

    return ok({
      totalRows: rows.length,
      updated,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders/csv" });
  }
}
