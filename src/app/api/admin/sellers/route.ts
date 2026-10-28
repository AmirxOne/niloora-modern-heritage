import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverLogger } from "@/lib/observability/logger";
import { prisma } from "@/lib/server/prisma";
import { toSellerPublicDto, SELLER_STATUSES } from "@/lib/server/sellers/seller-service";

/** Admin: list sellers with product counts and balance summary. */
export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const status = new URL(request.url).searchParams.get("status");
    const where =
      status && (SELLER_STATUSES as readonly string[]).includes(status)
        ? { status }
        : undefined;

    const sellers = await prisma.seller.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({
      sellers: sellers.map((row) => ({
        ...toSellerPublicDto(row),
        owner: { name: row.user.name, phone: row.user.phone },
        commissionPercent: row.commissionPercent,
      })),
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/sellers" });
  }
}

type PatchBody = {
  status?: string;
  commissionPercent?: number;
};

/** Admin: approve / suspend / reactivate a seller, set commission. */
export async function PATCH(request: Request) {
  try {
    const admin = await readSessionUser();
    const denied = ensureAdmin(admin);
    if (denied) return denied;

    const body = (await request.json()) as PatchBody;
    const sellerId = body as unknown as { id?: string };

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") ?? sellerId.id;
    if (!id) return badRequest("شناسه فروشنده الزامی است.");

    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) return notFound("فروشنده یافت نشد.");

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!(SELLER_STATUSES as readonly string[]).includes(body.status)) {
        return badRequest("وضعیت مجاز: pending / active / suspended");
      }
      data.status = body.status;
    }
    if (body.commissionPercent !== undefined) {
      const c = Math.floor(Number(body.commissionPercent));
      if (!Number.isFinite(c) || c < 0 || c > 50) {
        return badRequest("کمیسیون باید بین ۰ تا ۵۰ درصد باشد.");
      }
      data.commissionPercent = c;
    }
    if (Object.keys(data).length === 0) {
      return badRequest("تغییری ارسال نشده است.");
    }

    const updated = await prisma.seller.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });

    serverLogger.info("seller updated by admin", {
      sellerId: id,
      changes: data,
      adminId: admin!.id,
    });

    return ok({ seller: { ...toSellerPublicDto(updated), commissionPercent: updated.commissionPercent } });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/sellers" });
  }
}
