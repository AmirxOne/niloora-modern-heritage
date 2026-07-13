export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { requestRefund } from "@/lib/server/marketplace/refund/refund-service";
import { RefundError } from "@/lib/server/marketplace/refund/refund-errors";
import { toRefundDto } from "@/lib/server/marketplace/refund/refund-dto";
import {
  dispatchDomainEvents,
  ensureDefaultDomainEventHandlers,
} from "@/lib/server/marketplace/events/domain-events";

function parseInt10(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const page = parseInt10(searchParams.get("page"), 1);
    const pageSize = Math.min(100, parseInt10(searchParams.get("pageSize"), 20));
    const orderId = searchParams.get("orderId")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;

    const where = {
      ...(orderId ? { orderId } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.refund.count({ where }),
      prisma.refund.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      refunds: rows.map(toRefundDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/refunds" });
  }
}

type CreateBody = {
  orderId?: string;
  amount?: number;
  type?: "full" | "partial";
  reason?: string | null;
  reference?: string;
  orderReturnId?: string | null;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json().catch(() => ({}))) as CreateBody;
    const orderId = body.orderId?.trim();
    const reference = body.reference?.trim();

    if (!orderId) return badRequest("شناسه سفارش الزامی است.");
    if (!Number.isInteger(body.amount) || (body.amount ?? 0) <= 0) {
      return badRequest("مبلغ بازپرداخت نامعتبر است.");
    }
    if (!reference) return badRequest("کلید یکتای درخواست (reference) الزامی است.");

    try {
      const { refund, deduped } = await requestRefund({
        orderId,
        amount: body.amount as number,
        type: body.type,
        reason: body.reason ?? null,
        reference,
        orderReturnId: body.orderReturnId ?? null,
        requestedById: user?.id ?? null,
      });

      await writeAdminAuditLog({
        user,
        request,
        action: "refund.request",
        route: "/api/admin/refunds",
        entityType: "refund",
        entityId: refund.id,
        summary: `refund ${refund.id} requested for order ${orderId} amount ${Number(refund.amount)}`,
        payload: { refundId: refund.id, orderId, amount: Number(refund.amount), deduped },
      });

      ensureDefaultDomainEventHandlers();
      await dispatchDomainEvents();

      return ok({ refund: toRefundDto(refund), deduped });
    } catch (err) {
      if (err instanceof RefundError) return badRequest(err.message, err.code);
      throw err;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/refunds" });
  }
}
