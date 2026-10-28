import { readActiveSeller } from "@/lib/server/sellers/guard";
import { badRequest, created, ok } from "@/lib/server/http";
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
  id?: string;
  name?: string;
  namePersian?: string;
  price?: number;
  listPrice?: number | null;
  discountPercent?: number | null;
  image?: string;
  category?: string;
  metal?: string;
  stone?: string;
  stoneShape?: string;
  engravingType?: string;
  availability?: string;
  stock?: number;
  headline?: string;
  details?: string[];
};

/** List own products (any status — the seller sees their own catalog). */
export async function GET() {
  try {
    const guard = await readActiveSeller();
    if (!guard.ok) return guard.response;

    const rows = await prisma.product.findMany({
      where: { sellerId: guard.seller.id },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });

    return ok({ products: rows.map(mapDbProduct) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/products" });
  }
}

/** Create a product under the seller's shop. */
export async function POST(request: Request) {
  try {
    const guard = await readActiveSeller();
    if (!guard.ok) return guard.response;

    const body = (await request.json()) as Body;
    const id = body.id?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const namePersian = body.namePersian?.trim() || name;
    const price = Math.floor(Number(body.price ?? 0));

    if (!/^[a-z0-9-]{3,60}$/.test(id)) {
      return badRequest("شناسه محصول باید ۳ تا ۶۰ کاراکتر انگلیسی/خط تیره باشد.");
    }
    if (name.length < 2) return badRequest("نام محصول الزامی است.");
    if (!Number.isFinite(price) || price < 1_000_000) {
      return badRequest("قیمت باید حداقل ۱٬۰۰۰٬۰۰۰ تومان باشد.");
    }
    if (!body.image?.trim()) return badRequest("تصویر محصول الزامی است.");

    const taken = await prisma.product.findUnique({ where: { id } });
    if (taken) return badRequest("این شناسه محصول قبلاً استفاده شده است.");

    const stock = Math.max(0, Math.floor(Number(body.stock ?? 1)));

    const product = await prisma.product.create({
      data: {
        id,
        name,
        namePersian,
        price,
        listPrice: body.listPrice ?? null,
        discountPercent: body.discountPercent ?? null,
        image: body.image.trim(),
        category: body.category ?? "solitaire",
        metal: body.metal ?? "sterling",
        stone: body.stone ?? "onyx",
        stoneShape: body.stoneShape ?? "round",
        engravingType: body.engravingType ?? "none",
        availability: body.availability ?? "ready",
        stock,
        sellerId: guard.seller.id,
        listing: {
          create: {
            tier: "premium",
            headline: body.headline?.trim() || namePersian,
            details: Array.isArray(body.details) && body.details.length
              ? body.details.slice(0, 8).map(String)
              : ["مشخصات توسط فروشنده تکمیل نشده است"],
          },
        },
      },
      include: productInclude,
    });

    return created({ product: mapDbProduct(product) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/seller/products" });
  }
}
