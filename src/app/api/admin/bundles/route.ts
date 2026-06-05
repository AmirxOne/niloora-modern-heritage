export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminBundleBody } from "@/lib/server/bundle/admin-bundle-parse";
import {
  createBundleOffer,
  listAdminBundleOffers,
} from "@/lib/server/bundle/bundle-offer-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const bundles = await listAdminBundleOffers();
    return ok({ bundles });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/bundles" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const parsed = parseAdminBundleBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    const bundle = await createBundleOffer(parsed.data);
    return created({ bundle });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/bundles" });
  }
}
