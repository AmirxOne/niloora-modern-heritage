export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() ?? "";
    if (!token) return badRequest("missing_token");

    const row = await prisma.priceDropUnsubscribeToken.findUnique({ where: { token } });
    if (!row) return badRequest("invalid_token");

    await prisma.priceDropUnsubscribeToken.update({
      where: { id: row.id },
      data: { active: false },
    });

    return ok({ unsubscribed: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/price-drop/unsubscribe" });
  }
}
