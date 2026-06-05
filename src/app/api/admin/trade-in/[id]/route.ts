export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  isTradeInStatus,
  TRADE_IN_INTERNAL_NOTES_MAX,
} from "@/lib/server/trade-in/admin-trade-in";
import { toAdminTradeInDto } from "@/lib/server/trade-in/admin-trade-in-dto";
import { prisma } from "@/lib/server/prisma";

type Body = {
  status?: string;
  internalNotes?: string | null;
};

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
    const hasInternalNotes = body.internalNotes !== undefined;

    if (!hasStatus && !hasInternalNotes) {
      return badRequest("وضعیت یا یادداشت داخلی را ارسال کنید.");
    }

    if (hasStatus && (!body.status || !isTradeInStatus(body.status))) {
      return badRequest("وضعیت درخواست معتبر نیست.");
    }

    let internalNotes: string | null | undefined;
    if (hasInternalNotes) {
      const raw = body.internalNotes;
      if (raw === null || raw === "") {
        internalNotes = null;
      } else {
        const trimmed = String(raw).trim();
        if (trimmed.length > TRADE_IN_INTERNAL_NOTES_MAX) {
          return badRequest(
            `یادداشت داخلی حداکثر ${TRADE_IN_INTERNAL_NOTES_MAX.toLocaleString("fa-IR")} کاراکتر است.`
          );
        }
        internalNotes = trimmed;
      }
    }

    const existing = await prisma.tradeInSubmission.findUnique({ where: { id } });
    if (!existing) return notFound("درخواست یافت نشد.");

    const submission = await prisma.tradeInSubmission.update({
      where: { id },
      data: {
        ...(hasStatus ? { status: body.status } : {}),
        ...(hasInternalNotes ? { internalNotes } : {}),
      },
    });

    return ok({ submission: toAdminTradeInDto(submission) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/trade-in/[id]" });
  }
}
