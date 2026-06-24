export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import {
  createVendorProduct,
  listVendorProducts,
  type VendorProductInput,
} from "@/lib/server/marketplace/vendor-product-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const products = await listVendorProducts(user.id);
    return ok({ products });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/products" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as Partial<VendorProductInput>;
    if (!body.name?.trim() || !body.namePersian?.trim() || !body.image?.trim()) {
      return badRequest("نام، نام فارسی و تصویر محصول الزامی است.");
    }
    if (body.price == null || !Number.isFinite(Number(body.price))) {
      return badRequest("قیمت محصول نامعتبر است.");
    }

    const product = await createVendorProduct(user.id, {
      name: body.name,
      namePersian: body.namePersian,
      price: Number(body.price),
      image: body.image,
      category: body.category,
      metal: body.metal,
      stone: body.stone,
      stoneShape: body.stoneShape,
      engravingType: body.engravingType,
      availability: body.availability,
      stock: body.stock,
      listingHeadline: body.listingHeadline,
    });

    return created({ product });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/products" });
  }
}
