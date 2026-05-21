import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { toAdminSupportRequestDto } from "@/lib/server/support-request/admin-support-request-dto";
import {
  isSupportRequestStatus,
  SUPPORT_INTERNAL_NOTES_MAX,
} from "@/lib/server/support-request/support-request";
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

    if (hasStatus && (!body.status || !isSupportRequestStatus(body.status))) {
      return badRequest("وضعیت درخواست معتبر نیست.");
    }

    let internalNotes: string | null | undefined;
    if (hasInternalNotes) {
      const raw = body.internalNotes;
      if (raw === null || raw === "") {
        internalNotes = null;
      } else {
        const trimmed = String(raw).trim();
        if (trimmed.length > SUPPORT_INTERNAL_NOTES_MAX) {
          return badRequest(
            `یادداشت داخلی حداکثر ${SUPPORT_INTERNAL_NOTES_MAX.toLocaleString("fa-IR")} کاراکتر است.`
          );
        }
        internalNotes = trimmed;
      }
    }

    const existing = await prisma.supportRequest.findUnique({ where: { id } });
    if (!existing) return notFound("درخواست یافت نشد.");

    const row = await prisma.supportRequest.update({
      where: { id },
      data: {
        ...(hasStatus ? { status: body.status } : {}),
        ...(hasInternalNotes ? { internalNotes } : {}),
      },
    });

    return ok({ request: toAdminSupportRequestDto(row) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/support-requests/[id]" });
  }
}
