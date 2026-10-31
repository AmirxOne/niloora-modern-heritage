import { readActiveSeller } from "@/lib/server/sellers/guard";
import { invalidateCache } from "@/lib/server/cache";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { mapDbProduct } from "@/lib/server/products";
import type { Prisma } from "@prisma/client";

const productInclude = {
  listing: true,
  preOwnedInfo: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  collection: true,
  seller: { select: { id: true, shopName: true, slug: true, status: true } },
} satisfies Prisma.ProductInclude;

type Body = {
  price?: number;
  stock?: number;
  availability?: string;
  namePersian?: string;
  headline?: string;
};

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Update own product — ownership enforced via sellerId scoping.
 * Sellers may NOT unpublish/delete; admin moderation remains possible
 * through the existing admin product endpoints.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await readActiveSeller();
    if (!guard.ok) return guard.response;

    const { id } = await context.params;

    // ownership check: product must belong to this seller
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.sellerId !== guard.seller.id) {
      return notFound("محصول یافت نشد.");
    }

    const body = (await request.json()) as Body;
    const data: Record<string, unknown> = {};

    if (body.price !== undefined) {
      const price = Math.floor(Number(body.price));
      if (!Number.isFinite(price) || price < 1_000_000) {
        return badRequest("قیمت باید حداقل ۱٬۰۰۰٬۰۰۰ تومان باشد.");
      }
      data.price = price;
    }
    if (body.stock !== undefined) {
      const stock = Math.max(0, Math.floor(Number(body.stock)));
      data.stock = stock;
      if (stock === 0) data.availability = "sold";
    }
    if (body.availability !== undefined) {
      const allowed = ["ready", "preorder", "made-to-order"];
      if (!allowed.includes(body.availability)) {
        return badRequest("وضعیت مجاز: ready / preorder / made-to-order");
      }
      data.availability = body.availability;
    }
    if (body.namePersian !== undefined && body.namePersian.trim()) {
      data.namePersian = body.namePersian.trim();
    }

    if (Object.keys(data).length === 0) {
      return badRequest("تغییری ارسال نشده است.");
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });

    if (body.headline !== undefined && product.listing) {
      await prisma.productListing.update({
        where: { productId: id },
        data: { headline: body.headline.trim() || product.listing.headline },
      });
    }

    await invalidateCache("catalog");
    return ok({ product: mapDbProduct(product) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/products/[id]" });
  }
}
