export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";

type Body = {
  active?: boolean;
  expiresAt?: string | null;
  note?: string;
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
    if (!id) return badRequest("شناسه کارت هدیه نامعتبر است.");
    let expiresAt: Date | null | undefined;
    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === "") {
        expiresAt = null;
      } else {
        const parsed = new Date(body.expiresAt);
        if (Number.isNaN(parsed.getTime())) return badRequest("تاریخ انقضا نامعتبر است.");
        expiresAt = parsed;
      }
    }
    const row = await prisma.giftCard.update({
      where: { id },
      data: {
        ...(typeof body.active === "boolean" ? { active: body.active } : {}),
        ...(expiresAt !== undefined ? { expiresAt } : {}),
        ...(body.note !== undefined ? { note: body.note.trim() || null } : {}),
      },
    });
    return ok({
      giftCard: {
        id: row.id,
        code: row.code,
        initialAmount: row.initialAmount,
        remainingAmount: row.remainingAmount,
        active: row.active,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        note: row.note ?? "",
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/gift-cards/[id]" });
  }
}
