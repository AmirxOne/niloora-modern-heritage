import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import {
  adminOrderReturnListSelect,
  toAdminOrderReturnDto,
} from "@/lib/server/returns/admin-order-return-dto";
import {
  parseOrderReturnFilter,
  parseReturnPage,
  parseReturnPageSize,
} from "@/lib/server/returns/order-return";
import { createOrderReturn, type ReturnItemInput } from "@/lib/server/returns/order-return-service";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const statusFilter = parseOrderReturnFilter(searchParams.get("status"));
    const orderId = searchParams.get("orderId")?.trim() || undefined;
    const page = parseReturnPage(searchParams.get("page"));
    const pageSize = parseReturnPageSize(searchParams.get("pageSize"));

    const where = {
      ...(statusFilter === "all" ? {} : { status: statusFilter }),
      ...(orderId ? { orderId } : {}),
    };

    const [total, returns] = await Promise.all([
      prisma.orderReturn.count({ where }),
      prisma.orderReturn.findMany({
        where,
        select: adminOrderReturnListSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      returns: returns.map(toAdminOrderReturnDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/returns" });
  }
}

type PostBody = {
  orderId?: string;
  reason?: string;
  reasonDetail?: string | null;
  refundableAmount?: number;
  items?: ReturnItemInput[];
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as PostBody;
    if (!body.orderId?.trim()) {
      return badRequest("شناسه سفارش الزامی است.");
    }
    if (!body.reason?.trim()) {
      return badRequest("دلیل مرجوعی الزامی است.");
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return badRequest("اقلام مرجوعی را مشخص کنید.");
    }

    try {
      const created = await createOrderReturn({
        orderId: body.orderId.trim(),
        reason: body.reason.trim(),
        reasonDetail: body.reasonDetail,
        refundableAmount: body.refundableAmount,
        items: body.items,
        changedById: user?.id ?? null,
      });

      await writeAdminAuditLog({
        user,
        request,
        action: "admin.returns.create",
        route: "/api/admin/returns",
        entityType: "order_return",
        entityId: created.id,
        summary: `create return ${created.id} for order ${created.orderId}`,
        payload: { returnId: created.id, orderId: created.orderId },
      });

      return ok({ return: created });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ثبت مرجوعی انجام نشد.";
      return badRequest(message);
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/returns" });
  }
}
