import type { Prisma } from "@prisma/client";
import type { AdminUser, AdminUserDetail } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";

export const adminUserListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  blocked: true,
  memberSince: true,
  createdAt: true,
  loyaltyTier: true,
  loyaltyPoints: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

type AdminUserListRow = Prisma.UserGetPayload<{ select: typeof adminUserListSelect }>;

export function toAdminUserDto(
  user: AdminUserListRow,
  totalSpent = 0
): AdminUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role as AdminUser["role"],
    blocked: user.blocked,
    memberSince: user.memberSince.toISOString(),
    createdAt: user.createdAt.toISOString(),
    loyaltyTier: user.loyaltyTier,
    loyaltyPoints: user.loyaltyPoints ?? 0,
    orderCount: user._count.orders,
    totalSpent,
  };
}

export const adminUserDetailSelect = {
  ...adminUserListSelect,
  firstName: true,
  lastName: true,
  province: true,
  city: true,
  referralCode: true,
  referralCredit: true,
  loyaltyLifetimeSpend: true,
} satisfies Prisma.UserSelect;

type AdminUserDetailRow = Prisma.UserGetPayload<{ select: typeof adminUserDetailSelect }>;

export function toAdminUserDetailDto(
  user: AdminUserDetailRow,
  totalSpent = 0
): AdminUserDetail {
  return {
    ...toAdminUserDto(user, totalSpent),
    firstName: user.firstName,
    lastName: user.lastName,
    province: user.province,
    city: user.city,
    referralCode: user.referralCode,
    referralCredit: user.referralCredit ?? 0,
    loyaltyLifetimeSpend: user.loyaltyLifetimeSpend ?? 0,
  };
}

export async function loadOrderTotalsByUserId(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const rows = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { total: true },
  });

  return new Map(rows.map((row) => [row.userId, row._sum.total ?? 0]));
}
