export { dynamic } from "@/lib/server/route-segment";

import { Prisma } from "@prisma/client";
import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import {
  parseAdminUsersPage,
  parseAdminUsersPageSize,
  parseAdminUsersSearch,
} from "@/lib/server/users/admin-user";
import {
  adminUserListSelect,
  loadOrderTotalsByUserId,
  toAdminUserDto,
} from "@/lib/server/users/admin-user-dto";

function buildSearchWhere(q: string): Prisma.UserWhereInput | undefined {
  if (!q) return undefined;
  const digits = q.replace(/\D/g, "");
  const or: Prisma.UserWhereInput[] = [
    { name: { contains: q, mode: "insensitive" } },
    { phone: { contains: q } },
  ];
  if (digits.length >= 4) {
    or.push({ phone: { contains: digits } });
  }
  if (q.includes("@")) {
    or.push({ email: { contains: q, mode: "insensitive" } });
  }
  return { OR: or };
}

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const q = parseAdminUsersSearch(searchParams.get("q"));
    const page = parseAdminUsersPage(searchParams.get("page"));
    const pageSize = parseAdminUsersPageSize(searchParams.get("pageSize"));
    const where = buildSearchWhere(q);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: adminUserListSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totals = await loadOrderTotalsByUserId(users.map((u) => u.id));

    return ok({
      users: users.map((u) => toAdminUserDto(u, totals.get(u.id) ?? 0)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/users" });
  }
}
