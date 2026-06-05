export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { handleRouteError } from "@/lib/server/route-errors";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const [stats, recent] = await Promise.all([
      prisma.referralInvite.groupBy({
        by: ["status"],
        where: { inviterId: user.id },
        _count: { _all: true },
      }),
      prisma.referralInvite.findMany({
        where: { inviterId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          invitee: { select: { id: true, phone: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const summary = {
      totalInvites: 0,
      registeredCount: 0,
      rewardedCount: 0,
      blockedCount: 0,
    };
    for (const item of stats) {
      const count = item._count._all;
      summary.totalInvites += count;
      if (item.status === "registered") summary.registeredCount += count;
      if (item.status === "rewarded") summary.rewardedCount += count;
      if (item.status === "blocked") summary.blockedCount += count;
    }

    return ok({
      referralCode: user.referralCode,
      referralCredit: user.referralCredit ?? 0,
      referralEarnedTotal: user.referralEarnedTotal ?? 0,
      summary,
      recentInvites: recent.map((invite) => ({
        id: invite.id,
        status: invite.status,
        antiFraudReason: invite.antiFraudReason ?? null,
        inviterReward: invite.inviterReward,
        inviteeReward: invite.inviteeReward,
        createdAt: invite.createdAt.toISOString(),
        rewardedAt: invite.rewardedAt?.toISOString() ?? null,
        invitee: {
          id: invite.invitee.id,
          phone: invite.invitee.phone,
          name:
            [invite.invitee.firstName, invite.invitee.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || invite.invitee.phone,
        },
      })),
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/referrals/summary" });
  }
}
