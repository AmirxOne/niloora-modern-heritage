import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  ADMIN_ORDER_STATUSES,
  isAdminSettableStatus,
} from "@/lib/server/orders/admin-order";
import { toAdminOrderDto } from "@/lib/server/orders/admin-order-dto";
import { orderInclude } from "@/lib/server/orders/order-dto";
import { notifyOrderAdminUpdate } from "@/lib/server/notifications/order-notify";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

type Body = {
  status?: string;
  trackingCode?: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        ...orderInclude,
        user: { select: { name: true, phone: true, email: true } },
      },
    });
    if (!order) return notFound("سفارش یافت نشد.");

    return ok({ order: toAdminOrderDto(order) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders/[id]" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as Body;

    const hasStatus = body.status !== undefined;
    const hasTracking = body.trackingCode !== undefined;

    if (!hasStatus && !hasTracking) {
      return badRequest("وضعیت یا کد رهگیری را ارسال کنید.");
    }

    if (hasStatus && (!body.status || !isAdminSettableStatus(body.status))) {
      return badRequest(
        `وضعیت مجاز: ${ADMIN_ORDER_STATUSES.join("، ")}`
      );
    }

    let trackingCode: string | null | undefined;
    if (hasTracking) {
      const raw = body.trackingCode;
      if (raw === null || raw === "") {
        trackingCode = null;
      } else {
        const trimmed = String(raw).trim();
        if (trimmed.length < 4 || trimmed.length > 64) {
          return badRequest("کد رهگیری باید بین ۴ تا ۶۴ کاراکتر باشد.");
        }
        trackingCode = trimmed;
      }
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return notFound("سفارش یافت نشد.");

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(hasStatus ? { status: body.status } : {}),
        ...(hasTracking ? { trackingCode } : {}),
      },
      include: {
        ...orderInclude,
        user: { select: { name: true, phone: true, email: true } },
      },
    });

    notifyOrderAdminUpdate({
      orderId: order.id,
      previousStatus: existing.status,
      newStatus: order.status,
      previousTracking: existing.trackingCode,
      newTracking: order.trackingCode,
    });

    await writeAdminAuditLog({
      user,
      request,
      action: "admin.orders.update",
      route: "/api/admin/orders/[id]",
      entityType: "order",
      entityId: id,
      summary: `update order ${id}`,
      payload: {
        id,
        previousStatus: existing.status,
        nextStatus: order.status,
        previousTracking: existing.trackingCode,
        nextTracking: order.trackingCode,
      },
    });

    return ok({ order: toAdminOrderDto(order) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders/[id]" });
  }
}
