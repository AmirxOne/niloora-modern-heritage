import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { isPrismaMissingTableOrColumn } from "@/lib/server/prisma-schema-drift";

export const otpAuthUserSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  referralCode: true,
  referralCredit: true,
  referralEarnedTotal: true,
  role: true,
  blocked: true,
  memberSince: true,
  tier: true,
} satisfies Prisma.UserSelect;

export type OtpAuthUser = Prisma.UserGetPayload<{ select: typeof otpAuthUserSelect }>;

const otpAuthUserSelectWithoutBlocked = {
  id: true,
  name: true,
  phone: true,
  email: true,
  referralCode: true,
  referralCredit: true,
  referralEarnedTotal: true,
  role: true,
  memberSince: true,
  tier: true,
} satisfies Prisma.UserSelect;

type OtpAuthUserWithoutBlocked = Prisma.UserGetPayload<{
  select: typeof otpAuthUserSelectWithoutBlocked;
}>;

function withBlockedDefault(user: OtpAuthUserWithoutBlocked): OtpAuthUser {
  return { ...user, blocked: false };
}

export async function findOtpAuthUserByPhone(phone: string): Promise<OtpAuthUser | null> {
  try {
    return await prisma.user.findUnique({
      where: { phone },
      select: otpAuthUserSelect,
    });
  } catch (error) {
    if (!isPrismaMissingTableOrColumn(error, "blocked")) throw error;
    const user = await prisma.user.findUnique({
      where: { phone },
      select: otpAuthUserSelectWithoutBlocked,
    });
    return user ? withBlockedDefault(user) : null;
  }
}

type UserDb = Pick<typeof prisma, "user">;

export async function createOtpAuthUser(
  data: Prisma.UserUncheckedCreateInput,
  db: UserDb = prisma
): Promise<OtpAuthUser> {
  try {
    return await db.user.create({
      data,
      select: otpAuthUserSelect,
    });
  } catch (error) {
    if (!isPrismaMissingTableOrColumn(error, "blocked")) throw error;
    const user = await db.user.create({
      data,
      select: otpAuthUserSelectWithoutBlocked,
    });
    return withBlockedDefault(user);
  }
}
