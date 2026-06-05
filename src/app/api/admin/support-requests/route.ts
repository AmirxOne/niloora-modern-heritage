export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { toAdminSupportRequestDto } from "@/lib/server/support-request/admin-support-request-dto";
import {
  parseSupportRequestFilter,
  parseSupportRequestKindFilter,
} from "@/lib/server/support-request/support-request";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const statusFilter = parseSupportRequestFilter(searchParams.get("status"));
    const kindFilter = parseSupportRequestKindFilter(searchParams.get("kind"));

    const rows = await prisma.supportRequest.findMany({
      where: {
        ...(statusFilter === "all" ? {} : { status: statusFilter }),
        ...(kindFilter === "all" ? {} : { kind: kindFilter }),
      },
      include: {
        orderReturn: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok({ requests: rows.map(toAdminSupportRequestDto) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/support-requests" });
  }
}
