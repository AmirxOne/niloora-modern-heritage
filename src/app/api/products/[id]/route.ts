import { notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCatalogProducts, getProductByIdFromDb, getRelatedProducts } from "@/lib/server/products";
import { getTelegramProductById } from "@/lib/server/telegram/sync";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const telegramProduct = await getTelegramProductById(id);
    if (telegramProduct) {
      return ok({ product: telegramProduct, related: [] });
    }
    const product = await getProductByIdFromDb(id);
    if (!product) return notFound("Product not found");

    const catalog = await getCatalogProducts();
    const related = getRelatedProducts(catalog, product.id, 4);
    return ok({ product, related });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/[id]" });
  }
}
