export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { toSettlementDto } from "@/lib/server/marketplace/settlement/settlement-dto";

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
    const vendorId = searchParams.get("vendorId")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;

    const where = {
      ...(vendorId ? { vendorId } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      settlements: rows.map(toSettlementDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/settlements" });
  }
}
