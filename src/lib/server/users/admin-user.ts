import { prisma } from "@/lib/server/prisma";

export type AdminUserDto = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "user" | "admin";
  memberSince: string;
  orderCount: number;
  totalSpentToman: number;
  isGuest: boolean;
};

const USER_PAGE_SIZE = 30;

export function mapAdminUser(row: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  memberSince: Date;
  passwordHash: string;
  _count?: { orders: number };
  orders?: Array<{ total: number }>;
}): AdminUserDto {
  const totalSpent = (row.orders ?? []).reduce((sum, o) => sum + o.total, 0);
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role === "admin" ? "admin" : "user",
    memberSince: row.memberSince.toISOString(),
    orderCount: row._count?.orders ?? row.orders?.length ?? 0,
    totalSpentToman: totalSpent,
    isGuest: row.passwordHash.startsWith("GUEST_") || row.passwordHash.startsWith("OTP_ONLY_"),
  };
}

export async function listAdminUsers(input: {
  q?: string | null;
  page: number;
}): Promise<{
  users: AdminUserDto[];
  total: number;
  totalPages: number;
  page: number;
}> {
  const q = input.q?.trim() ?? "";
  const where = q
    ? {
        OR: [
          { phone: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const page = Math.max(1, Math.floor(input.page));
  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { memberSince: "desc" },
      skip: (page - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { total: true }, where: { status: { not: "payment_failed" } } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows.map(mapAdminUser),
    total,
    totalPages: Math.max(1, Math.ceil(total / USER_PAGE_SIZE)),
    page,
  };
}
