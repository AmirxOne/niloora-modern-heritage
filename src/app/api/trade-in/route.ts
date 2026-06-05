export { dynamic } from "@/lib/server/route-segment";

import { prisma } from "@/lib/server/prisma";
import { badRequest, created, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";

type Body = {
  fullName?: string;
  phone?: string;
  ringDescription?: string;
  estimatedOriginalPrice?: number;
  notes?: string;
  wantsRemake?: boolean;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Body;
    const fullName = payload.fullName?.trim() ?? "";
    const phone = payload.phone?.trim() ?? "";
    const ringDescription = payload.ringDescription?.trim() ?? "";
    const estimatedOriginalPrice = Number(payload.estimatedOriginalPrice ?? 0);
    const notes = payload.notes?.trim();

    if (!fullName || !phone || !ringDescription || estimatedOriginalPrice <= 0) {
      return badRequest("Invalid trade-in payload");
    }

    const submission = await prisma.tradeInSubmission.create({
      data: {
        fullName,
        phone,
        ringDescription,
        estimatedOriginalPrice,
        notes: notes || null,
        wantsRemake: Boolean(payload.wantsRemake),
      },
    });

    return created({
      submission: {
        id: submission.id,
        createdAt: submission.createdAt.toISOString(),
        fullName: submission.fullName,
        phone: submission.phone,
        ringDescription: submission.ringDescription,
        estimatedOriginalPrice: submission.estimatedOriginalPrice,
        notes: submission.notes ?? undefined,
        wantsRemake: submission.wantsRemake,
        status: submission.status,
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/trade-in" });
  }
}
