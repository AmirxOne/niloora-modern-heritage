import { readActiveSeller } from "@/lib/server/sellers/guard";
import { badRequest, created, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { getSellerBalance } from "@/lib/server/sellers/seller-service";

type Body = {
  amount?: number;
  note?: string;
};

/** Seller requests a payout of their available balance. */
export async function POST(request: Request) {
  try {
    const guard = await readActiveSeller();
    if (!guard.ok) return guard.response;

    const body = (await request.json()) as Body;
    const amount = Math.floor(Number(body.amount ?? 0));
    if (!Number.isFinite(amount) || amount < 1_000_000) {
      return badRequest("حداقل مبلغ درخواست تسویه ۱٬۰۰۰٬۰۰۰ تومان است.");
    }

    const balance = await getSellerBalance(guard.seller.id);
    if (amount > balance.balanceToman) {
      return badRequest(
        `موجودی قابل تسویه شما ${balance.balanceToman.toLocaleString("fa-IR")} تومان است.`
      );
    }

    // one open payout at a time
    const openPayout = await prisma.sellerPayout.findFirst({
      where: { sellerId: guard.seller.id, status: { in: ["requested", "approved"] } },
      select: { id: true },
    });
    if (openPayout) {
      return badRequest("یک درخواست تسویه در جریان دارید. تا پایان آن صبر کنید.");
    }

    const payout = await prisma.sellerPayout.create({
      data: {
        sellerId: guard.seller.id,
        amount,
        note: body.note?.trim() || null,
        status: "requested",
      },
    });

    return created({ payout });
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/payouts" });
  }
}

/** Seller's payout history + current balance. */
export async function GET() {
  try {
    const guard = await readActiveSeller();
    if (!guard.ok) return guard.response;

    const [payouts, balance] = await Promise.all([
      prisma.sellerPayout.findMany({
        where: { sellerId: guard.seller.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      getSellerBalance(guard.seller.id),
    ]);

    return ok({ payouts, balance });
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/payouts" });
  }
}
