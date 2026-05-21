import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCollectionsFromDb } from "@/lib/server/products";

export async function GET() {
  try {
    const collections = await getCollectionsFromDb();
    return ok({ collections });
  } catch (error) {
    return handleRouteError(error, { route: "/api/collections" });
  }
}
