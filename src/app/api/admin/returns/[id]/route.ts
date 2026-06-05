export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import {
  adminOrderReturnDetailSelect,
  toAdminOrderReturnDetailDto,
} from "@/lib/server/returns/admin-order-return-dto";
import type { OrderReturnStatus } from "@/lib/server/returns/order-return";
import {
  updateOrderReturn,
  type ReturnItemInput,
} from "@/lib/server/returns/order-return-service";

type PatchBody = {
  status?: string;
  statusNote?: string | null;
  internalNotes?: string | null;
  refundableAmount?: number;
  reason?: string;
  reasonDetail?: string | null;
  items?: ReturnItemInput[];
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
    const row = await prisma.orderReturn.findUnique({
      where: { id },
      select: adminOrderReturnDetailSelect,
    });
    if (!row) return notFound("درخواست مرجوعی یافت نشد.");

    return ok({ return: toAdminOrderReturnDetailDto(row) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/returns/[id]" });
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
    const body = (await request.json()) as PatchBody;

    const hasAny =
      body.status !== undefined ||
      body.internalNotes !== undefined ||
      body.refundableAmount !== undefined ||
      body.reason !== undefined ||
      body.reasonDetail !== undefined ||
      body.items !== undefined;

    if (!hasAny) {
      return badRequest("حداقل یک فیلد برای بروزرسانی ارسال کنید.");
    }

    try {
      const updated = await updateOrderReturn(id, {
        status: body.status as OrderReturnStatus | undefined,
        statusNote: body.statusNote,
        internalNotes: body.internalNotes,
        refundableAmount: body.refundableAmount,
        reason: body.reason,
        reasonDetail: body.reasonDetail,
        items: body.items,
        changedById: user?.id ?? null,
      });

      await writeAdminAuditLog({
        user,
        request,
        action: "admin.returns.update",
        route: "/api/admin/returns/[id]",
        entityType: "order_return",
        entityId: id,
        summary: `update return ${id}`,
        payload: {
          returnId: id,
          status: updated.status,
          refundableAmount: updated.refundableAmount,
        },
      });

      return ok({ return: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "بروزرسانی مرجوعی انجام نشد.";
      return badRequest(message);
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/returns/[id]" });
  }
}
