import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverLogger } from "@/lib/observability/logger";
import { prisma } from "@/lib/server/prisma";

/** Admin: list payouts (optionally by status). */
export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const status = new URL(request.url).searchParams.get("status");
    const allowed = ["requested", "approved", "paid", "rejected"];
    const where =
      status && allowed.includes(status) ? { status } : undefined;

    const payouts = await prisma.sellerPayout.findMany({
      where,
      include: {
        seller: { select: { shopName: true, slug: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok({ payouts });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/seller-payouts" });
  }
}

type Body = {
  payoutId?: string;
  action?: "approve" | "mark_paid" | "reject";
  note?: string;
};

/**
 * Admin payout lifecycle:
 * - approve: requested → approved (still reserved against balance)
 * - mark_paid: approved|requested → paid (+ payout_debit ledger entry)
 * - reject: requested|approved → rejected (balance released)
 */
export async function POST(request: Request) {
  try {
    const admin = await readSessionUser();
    const denied = ensureAdmin(admin);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    if (!body.payoutId || !body.action) {
      return badRequest("payoutId و action الزامی است.");
    }

    const payout = await prisma.sellerPayout.findUnique({
      where: { id: body.payoutId },
    });
    if (!payout) return notFound("درخواست تسویه یافت نشد.");

    if (body.action === "approve") {
      if (payout.status !== "requested") {
        return badRequest("فقط درخواست‌های در انتظار قابل تأیید هستند.");
      }
      await prisma.sellerPayout.update({
        where: { id: payout.id },
        data: { status: "approved", note: body.note ?? payout.note },
      });
      return ok({ payoutId: payout.id, status: "approved" });
    }

    if (body.action === "mark_paid") {
      if (!["requested", "approved"].includes(payout.status)) {
        return badRequest("این تسویه قبلاً بسته شده است.");
      }
      await prisma.$transaction([
        prisma.sellerPayout.update({
          where: { id: payout.id },
          data: { status: "paid", note: body.note ?? payout.note },
        }),
        prisma.sellerLedgerEntry.create({
          data: {
            sellerId: payout.sellerId,
            kind: "payout_debit",
            amount: -payout.amount,
            note: `پرداخت تسویه ${payout.id}`,
          },
        }),
      ]);
      serverLogger.info("seller payout marked paid", {
        payoutId: payout.id,
        adminId: admin!.id,
      });
      return ok({ payoutId: payout.id, status: "paid" });
    }

    // reject
    if (!["requested", "approved"].includes(payout.status)) {
      return badRequest("این تسویه قابل رد نیست.");
    }
    await prisma.sellerPayout.update({
      where: { id: payout.id },
      data: { status: "rejected", note: body.note ?? payout.note },
    });
    return ok({ payoutId: payout.id, status: "rejected" });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/seller-payouts" });
  }
}
