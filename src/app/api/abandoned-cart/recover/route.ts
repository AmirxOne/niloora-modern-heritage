import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";

type Body = {
  token?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Body;
    const token = payload.token?.trim() ?? "";
    if (!token) {
      return badRequest("توکن بازیابی الزامی است.");
    }

    const row = await prisma.abandonedCartRecovery.findUnique({ where: { token } });
    if (!row) {
      return badRequest("لینک بازیابی معتبر نیست.");
    }

    await prisma.abandonedCartRecovery.update({
      where: { id: row.id },
      data: {
        status: "recovered",
        recoveredAt: new Date(),
      },
    });

    return ok({ recovered: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/abandoned-cart/recover" });
  }
}
